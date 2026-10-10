import {IPlayer} from '../IPlayer';
import {PlayerInput} from '../PlayerInput';
import {InputResponse} from '../../common/inputs/InputResponse';
import {OrOptions} from '../inputs/OrOptions';
import {SelectOption} from '../inputs/SelectOption';
import {SelectCard} from '../inputs/SelectCard';
import {SelectCardToPlay} from '../inputs/SelectCardToPlay';
import {UndoActionOption} from '../inputs/UndoActionOption';
import {IProjectCard, isIProjectCard} from '../cards/IProjectCard';
import {ICard} from '../cards/ICard';
import {remainingProductionPhases} from './gameProgress';
import {isIStandardProjectCard} from '../cards/IStandardProjectCard';
import {Tag} from '../../common/cards/Tag';
import {greedyPayment} from './greedyPayment';
import {quickResponse} from './quickResponse';
import {GameSnapshot, finishMove, isActionMenu, playerView, snapshotOf, withCopy} from './gameCopy';
import {ValuationContext, relativeValue, valuationContext} from './stateValue';
import {handCardValues} from './cardValue';
import {isTracingDecision, traceOptions} from './decisionTrace';
import {describeResponse} from './decisionLabels';
import {tuningOf} from './aiTuning';
import {RolloutEntry, rolloutMeans} from './rolloutSearch';

// Decides an action-phase move by playing every candidate move on a copy of the game and
// valuing the resulting position (one-step lookahead). This captures the effect of any card
// without card-specific code.

/** Time the AI may spend on one action on the server (~10 ms per tried move). */
const DEFAULT_BUDGET_MILLISECONDS = 2000;
const MAXIMUM_CANDIDATES = 120;
/** Opponent reply: how many of the opponent's moves are tried (the cheap ones come first in the menu). */
const REPLY_CANDIDATES = 60;
/** Rollout policy: moves tried per decision (turn-ending ones first, then the menu order). */
const GREEDY_CANDIDATES = 8;
/** Rollouts per move: fewer are too noisy to re-rank, more rarely fit the budget. */
const MINIMUM_ROLLOUTS = 1;
const MAXIMUM_ROLLOUTS = 8;
/** Against humans: rollouts only within this many M€ of the best move, and at most this long. */
const HUMAN_ROLLOUT_MARGIN = 5;
const HUMAN_ROLLOUT_BUDGET = 2000;
/** How many of the best moves a decision trace keeps. */
const TRACED_ACTION_OPTIONS = 25;

type Candidate = {response: InputResponse, endsTurn: boolean};

function isTurnEnding(option: PlayerInput): boolean {
  return option instanceof SelectOption && typeof option.title === 'string' &&
    (option.title === 'Pass for this generation' || option.title === 'End Turn');
}

function cardPayment(input: SelectCardToPlay<any>, card: IProjectCard, player: IPlayer) {
  const cost = isIStandardProjectCard(card) ?
    input.extras.get(card.name)?.overriddenCost ?? card.cost :
    player.getCardCost(card);
  return greedyPayment(player, cost, {
    steel: card.tags.includes(Tag.BUILDING),
    titanium: card.tags.includes(Tag.SPACE),
    heat: player.canUseHeatAsMegaCredits,
  });
}

/**
 * Selling a card for 1 M€ only pays off in the last generation, and only for cards that cannot
 * be played any more. Before, the AI sold cards it had just bought for 3 M€.
 */
function sellPatentResponses(input: SelectCard<ICard>, player: IPlayer): Array<InputResponse> {
  if (remainingProductionPhases(player.game, player) > 0) {
    return [];
  }
  const unplayable = input.cards.filter((card) => !isIProjectCard(card) || !player.canPlay(card));
  return unplayable.length === 0 ? [] : [{type: 'card', cards: unplayable.map((card) => card.name)}];
}

/** All complete answers worth trying for an input (one level of sub-choices expanded). */
function responsesFor(input: PlayerInput, player: IPlayer): Array<InputResponse> {
  if (input instanceof OrOptions) {
    const responses: Array<InputResponse> = [];
    input.options.forEach((option, index) => {
      if (option instanceof UndoActionOption) {
        return;
      }
      for (const response of responsesFor(option, player)) {
        responses.push({type: 'or', index, response});
      }
    });
    return responses;
  }
  if (input instanceof SelectOption) {
    return [{type: 'option'}];
  }
  if (input instanceof SelectCardToPlay) {
    return input.cards
      .filter((_card, index) => input.enabled?.[index] !== false)
      .map((card) => ({type: 'projectCard', card: card.name, payment: cardPayment(input, card, player)}));
  }
  if (input instanceof SelectCard && input.title === 'Sell patents') {
    return sellPatentResponses(input, player);
  }
  if (input instanceof SelectCard && input.config.min === 1 && input.config.max === 1) {
    return input.cards
      .filter((_card, index) => input.config.enabled?.[index] !== false)
      .map((card) => ({type: 'card', cards: [card.name]}));
  }
  try {
    return [quickResponse(input, player)];
  } catch {
    return [];
  }
}

function candidatesFor(menu: OrOptions, player: IPlayer): Array<Candidate> {
  const candidates: Array<Candidate> = [];
  menu.options.forEach((option, index) => {
    if (option instanceof UndoActionOption) {
      return;
    }
    for (const response of responsesFor(option, player)) {
      candidates.push({response: {type: 'or', index, response}, endsTurn: isTurnEnding(option)});
    }
  });
  // Turn-ending moves first: they are the baseline and must survive a cut by the time budget.
  candidates.sort((a, b) => Number(b.endsTurn) - Number(a.endsTurn));
  return candidates.slice(0, MAXIMUM_CANDIDATES);
}

/** Result of a tried move; `next` is set when the player still has an action left this turn. */
type Outcome = {
  value: number,
  /** Position right after the move (for the opponent reply). */
  snapshot?: GameSnapshot,
  next?: {snapshot: GameSnapshot, menuSize: number, candidates: Array<Candidate>},
  /** Best second action found for `next`. */
  bestSecond?: Candidate,
};

function tryCandidate(snapshot: GameSnapshot, player: IPlayer, menuSize: number, candidate: Candidate, context: ValuationContext, withNext: boolean): Outcome | undefined {
  return withCopy(snapshot, (copy): Outcome | undefined => {
    const copyPlayer = copy.getPlayerById(player.id);
    const menu = copyPlayer.getWaitingFor();
    // The copy must offer the same menu, otherwise the option indices would mean something else.
    if (!isActionMenu(menu) || menu.options.length !== menuSize) {
      return undefined;
    }
    const generation = copy.generation;
    try {
      copyPlayer.process(candidate.response);
    } catch {
      return undefined;
    }
    finishMove(copy, copyPlayer);
    const value = relativeValue(copyPlayer, context);
    const nextMenu = copyPlayer.getWaitingFor();
    if (!withNext || !isActionMenu(nextMenu) || copy.generation !== generation) {
      return {value, snapshot: withNext ? snapshotOf(copy) : undefined};
    }
    const snapshotAfter = snapshotOf(copy);
    return {value, snapshot: snapshotAfter, next: {snapshot: snapshotAfter, menuSize: nextMenu.options.length, candidates: candidatesFor(nextMenu, copyPlayer)}};
  });
}

export type LookaheadOptions = {
  /** Standard deviation in M€ added to every value: makes weaker levels misjudge moves. */
  noise: number,
  budgetMilliseconds?: number,
  random?: () => number,
  /** Diagnostics: receives every tried move with its value. */
  onEvaluated?: (response: InputResponse, value: number) => void,
};

function gaussian(random: () => number): number {
  const u = Math.max(random(), 1e-9);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * random());
}

/**
 * The own value after the next opponent's best reply (best for the opponent by its own valuation).
 * Races for milestones, awards and spots only show up here: before, the AI saw no difference
 * between claiming now and next turn. Undefined when no opponent moves before the own next turn.
 */
function valueAfterReply(snapshot: GameSnapshot, player: IPlayer, second: Candidate | undefined, context: ValuationContext, outOfTime: () => boolean): number | undefined {
  return withCopy(snapshot, (copy): number | undefined => {
    const copyPlayer = copy.getPlayerById(player.id);
    const generation = copy.generation;
    if (second !== undefined) {
      try {
        copyPlayer.process(second.response);
      } catch {
        return undefined;
      }
      finishMove(copy, copyPlayer);
    } else {
      // One action left but none better than stopping: end the turn as the AI would.
      const menu = copyPlayer.getWaitingFor();
      if (isActionMenu(menu)) {
        // "End Turn", not "Pass": passing would skip the rest of the generation.
        const index = menu.options.findIndex((option) => option instanceof SelectOption && option.title === 'End Turn');
        if (index < 0) {
          return undefined;
        }
        try {
          copyPlayer.process({type: 'or', index, response: {type: 'option'}});
        } catch {
          return undefined;
        }
      }
    }
    if (copy.generation !== generation) {
      return undefined;
    }
    const opponent = copy.players.find((other) => other.id !== player.id && isActionMenu(other.getWaitingFor()));
    const menu = opponent?.getWaitingFor();
    if (opponent === undefined || !isActionMenu(menu)) {
      return undefined;
    }
    const replySnapshot = snapshotOf(copy);
    const opponentContext = valuationContext(copy, opponent);
    let best: {opponentValue: number, ownValue: number} | undefined;
    for (const candidate of candidatesFor(menu, opponent).slice(0, REPLY_CANDIDATES)) {
      if (best !== undefined && outOfTime()) {
        break;
      }
      const result = withCopy(replySnapshot, (replyCopy) => {
        const replyOpponent = replyCopy.getPlayerById(opponent.id);
        const replyMenu = replyOpponent.getWaitingFor();
        if (!isActionMenu(replyMenu) || replyMenu.options.length !== menu.options.length) {
          return undefined;
        }
        try {
          replyOpponent.process(candidate.response);
        } catch {
          return undefined;
        }
        finishMove(replyCopy, replyOpponent);
        return {opponentValue: relativeValue(replyOpponent, opponentContext), ownValue: relativeValue(replyCopy.getPlayerById(player.id), context)};
      });
      if (result !== undefined && (best === undefined || result.opponentValue > best.opponentValue)) {
        best = result;
      }
    }
    return best?.ownValue;
  });
}

function passPenaltyFor(player: IPlayer): number {
  const tuning = tuningOf(player);
  return tuning.passPenalty > 0 && remainingProductionPhases(player.game, player) > 0 ? tuning.passPenalty * Math.min(player.megaCredits, 40) : 0;
}

function isPass(menu: OrOptions, response: InputResponse): boolean {
  const option = response.type === 'or' ? menu.options[response.index] : undefined;
  return option instanceof SelectOption && option.title === 'Pass for this generation';
}

/** Fast move choice inside rollouts: one step, a few moves, no hand values and no reply. */
export function greedyAction(menu: OrOptions, player: IPlayer): InputResponse | undefined {
  const snapshot = snapshotOf(player.game);
  const context = valuationContext(player.game, player);
  const penalty = passPenaltyFor(player);
  let best: {response: InputResponse, value: number} | undefined;
  for (const candidate of candidatesFor(menu, player).slice(0, GREEDY_CANDIDATES)) {
    const outcome = tryCandidate(snapshot, player, menu.options.length, candidate, context, false);
    if (outcome === undefined) {
      continue;
    }
    const value = outcome.value - (isPass(menu, candidate.response) ? penalty : 0);
    if (best === undefined || value > best.value) {
      best = {response: candidate.response, value};
    }
  }
  return best?.response;
}

/**
 * Two steps: every move is tried once; the most promising ones are then followed by the best
 * second action of the same turn (e.g. first take a bonus, then play the card it pays for).
 */
export function chooseAction(menu: OrOptions, player: IPlayer, options: LookaheadOptions): InputResponse | undefined {
  const start = performance.now();
  const budget = options.budgetMilliseconds ?? DEFAULT_BUDGET_MILLISECONDS;
  const random = options.random ?? Math.random;
  const snapshot = playerView(player);
  // Cards kept in hand count with their value when played later, so a card that grows with
  // the tableau is not wasted now.
  const context = {...valuationContext(player.game, player), handValues: handCardValues(player), handOwner: player.id};
  const outOfTime = () => performance.now() - start > budget;

  const tried: Array<{candidate: Candidate, outcome: Outcome}> = [];
  for (const candidate of candidatesFor(menu, player)) {
    if (tried.length > 0 && outOfTime()) {
      break;
    }
    const outcome = tryCandidate(snapshot, player, menu.options.length, candidate, context, true);
    if (outcome !== undefined) {
      tried.push({candidate, outcome});
    }
  }

  // Second step for the best few first moves that leave an action in this turn.
  const tuning = tuningOf(player);
  const promising = [...tried].sort((a, b) => b.outcome.value - a.outcome.value).slice(0, tuning.secondStepCandidates);
  for (const entry of promising) {
    const next = entry.outcome.next;
    if (next === undefined) {
      continue;
    }
    for (const second of next.candidates) {
      if (outOfTime()) {
        break;
      }
      const outcome = tryCandidate(next.snapshot, player, next.menuSize, second, context, false);
      if (outcome !== undefined && outcome.value > entry.outcome.value) {
        entry.outcome.value = outcome.value;
        entry.outcome.bestSecond = second;
      }
    }
  }

  // Opponent reply: the best few moves are judged by the position after the next opponent's
  // best answer. Only the order among them changes, so a missing reply keeps the plain value.
  if (tuning.opponentReplies > 0) {
    const finalists = [...tried].sort((a, b) => b.outcome.value - a.outcome.value).slice(0, tuning.opponentReplies);
    const replied: Array<{entry: typeof finalists[number], value: number}> = [];
    for (const entry of finalists) {
      if (outOfTime() || entry.outcome.snapshot === undefined) {
        break;
      }
      const value = valueAfterReply(entry.outcome.snapshot, player, entry.outcome.bestSecond, context, outOfTime);
      if (value !== undefined) {
        replied.push({entry, value});
      }
    }
    // All finalists need a reply value, otherwise they are not comparable.
    if (replied.length === finalists.length && replied.length > 1) {
      // Keep the finalists' value level, only re-rank them: the best reply-judged move gets the
      // best plain value, and so on.
      const plainValues = finalists.map((entry) => entry.outcome.value).sort((a, b) => b - a);
      replied.sort((a, b) => b.value - a.value).forEach((item, index) => {
        item.entry.outcome.value = plainValues[index];
      });
    }
  }

  // Rollouts: the best moves are re-ranked by playing on to the end of the generation; like the
  // reply, only their order changes. They see what a pass gives up, so no pass penalty then.
  let rolledOut = false;
  // Against humans the AI must not keep them waiting (human feedback: far too slow with 4 s of rollouts per
  // action): clear decisions skip the rollouts, the rest gets a shorter budget. AI-only test games
  // are not affected.
  const humans = player.game.players.some((other) => other.aiLevel === undefined);
  const rolloutMargin = humans && tuning.rolloutMargin <= 0 ? HUMAN_ROLLOUT_MARGIN : tuning.rolloutMargin;
  const rolloutBudget = humans ? Math.min(tuning.rolloutBudget, HUMAN_ROLLOUT_BUDGET) : tuning.rolloutBudget;
  if (tuning.rolloutCandidates > 0) {
    const ranked = [...tried].sort((a, b) => b.outcome.value - a.outcome.value);
    const bestPlain = ranked[0]?.outcome.value ?? 0;
    // A clear decision needs no rollouts: they cost seconds per action.
    const finalists = ranked.slice(0, tuning.rolloutCandidates)
      .filter((entry) => rolloutMargin <= 0 || bestPlain - entry.outcome.value <= rolloutMargin);
    const entries: Array<RolloutEntry> = [];
    for (const entry of finalists) {
      if (entry.outcome.snapshot !== undefined) {
        entries.push({snapshot: entry.outcome.snapshot, firstMove: entry.outcome.bestSecond?.response});
      }
    }
    if (finalists.length > 1 && entries.length === finalists.length) {
      const means = rolloutMeans(entries, player.id, greedyAction, rolloutBudget, MINIMUM_ROLLOUTS, MAXIMUM_ROLLOUTS);
      if (means !== undefined) {
        const plainValues = finalists.map((entry) => entry.outcome.value).sort((a, b) => b - a);
        finalists.map((entry, index) => ({entry, mean: means[index]}))
          .sort((a, b) => b.mean - a.mean)
          .forEach((item, index) => {
            item.entry.outcome.value = plainValues[index];
          });
        rolledOut = true;
      }
    }
  }

  // Passing gives up the rest of the generation while others still act. With the plain value a
  // pass was often within 1 M€ of the best move and the noise picked it (2963 passes with ≥ 25 M€
  // in 1600 night-run games). Money kept is worth less than the moves it could still make now.
  const penalty = rolledOut ? 0 : passPenaltyFor(player);
  if (penalty > 0) {
    for (const {candidate, outcome} of tried) {
      if (isPass(menu, candidate.response)) {
        outcome.value -= penalty;
      }
    }
  }

  let best: {response: InputResponse, value: number} | undefined;
  for (const {candidate, outcome} of tried) {
    options.onEvaluated?.(candidate.response, outcome.value);
    const judged = outcome.value + options.noise * gaussian(random);
    if (best === undefined || judged > best.value) {
      best = {response: candidate.response, value: judged};
    }
  }
  if (isTracingDecision()) {
    // The best moves and the chosen one; the rest would only bloat the trace.
    const ranked = [...tried].sort((a, b) => b.outcome.value - a.outcome.value);
    const shown = ranked.filter((entry, index) => index < TRACED_ACTION_OPTIONS || entry.candidate.response === best?.response);
    traceOptions('action', shown.map((entry) => ({
      label: describeResponse(menu, entry.candidate.response),
      value: Math.round(entry.outcome.value * 10) / 10,
      chosen: entry.candidate.response === best?.response,
    })), {candidates: candidatesFor(menu, player).length, tried: tried.length, milliseconds: Math.round(performance.now() - start)});
  }
  return best?.response;
}
