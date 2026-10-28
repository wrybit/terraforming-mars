import {IPlayer} from '../IPlayer';
import {PlayerInput} from '../PlayerInput';
import {InputResponse} from '../../common/inputs/InputResponse';
import {OrOptions} from '../inputs/OrOptions';
import {SelectOption} from '../inputs/SelectOption';
import {SelectCard} from '../inputs/SelectCard';
import {SelectCardToPlay} from '../inputs/SelectCardToPlay';
import {UndoActionOption} from '../inputs/UndoActionOption';
import {isIProjectCard} from '../cards/IProjectCard';
import {ICard} from '../cards/ICard';
import {remainingProductionPhases} from './gameProgress';
import {cardPayment} from './greedyPayment';
import {fundingAllowed} from './awardFunding';
import {quickResponse} from './quickResponse';
import {GameSnapshot, finishMove, isActionMenu, playerView, snapshotOf, withCopy} from './gameCopy';
import {ValuationContext, relativeValue, valuationContext} from './stateValue';
import {handCardValues} from './cardValue';
import {isTracingDecision, traceOptions} from './decisionTrace';
import {describeResponse} from './decisionLabels';
import {tuningOf} from './aiTuning';
import {RolloutEntry, RolloutPolicy, rolloutMeans} from './rolloutSearch';
import {isStandardProject, standardProjectPenalty} from './standardProjectRestraint';
import {cheapFirstPenalty} from './cheapFirst';
import {drawEngineTimingBonus} from './drawEngineValue';
import {isUselessMove} from './uselessMove';
import {cityFirstActionAdjustment} from './cityFirstAction';
import {milestoneReservePenalty} from './milestoneReserve';
import {capAgainstPass} from './passFairness';
import {triggerOrderAdjustments} from './triggerOrder';
import {playPreferences} from './bgaPolicy';
import {handReadinessMap} from './handReadiness';
import {handOutlookMap} from './liveOutlook';
import {sellToAffordResponses} from './sellToAfford';
import {lastGenerationSaleResponses} from './lastGenerationSale';
import {isSimulating} from './simulationSandbox';
import {CardName} from '../../common/cards/CardName';
import {clearFollowUpPlan, followUpChoices, setFollowUpPlan} from './followUpPlan';

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
/** Rollouts per move at least (the most: tuning rolloutMaximumRounds). */
const MINIMUM_ROLLOUTS = 1;
/** Against humans: rollouts only within this many M€ of the best move, and at most this long. */
const HUMAN_ROLLOUT_MARGIN = 5;
const HUMAN_ROLLOUT_BUDGET = 2000;
/** How many of the best moves a decision trace keeps. */
const TRACED_ACTION_OPTIONS = 25;

/** `followUps`: planned option indices for OR questions right after the move (followUpPlan.ts). */
type Candidate = {response: InputResponse, endsTurn: boolean, followUps?: ReadonlyArray<number>};

function isTurnEnding(option: PlayerInput): boolean {
  return option instanceof SelectOption && typeof option.title === 'string' &&
    (option.title === 'Pass for this generation' || option.title === 'End Turn');
}

/**
 * Selling a card for 1 M€ only pays off in the last generation, and only for cards that cannot
 * be played any more. Before, the AI sold cards it had just bought for 3 M€.
 */
function sellPatentResponses(input: SelectCard<ICard>, player: IPlayer): Array<InputResponse> {
  if (remainingProductionPhases(player.game, player) > 0) {
    // Before: a sale that pays for a milestone or award this turn (sellToAfford.ts). Not inside
    // game copies (rollouts, replies): the hand values cost too much there.
    return tuningOf(player).sellToAfford > 0 && !isSimulating() ? sellToAffordResponses(player, handCardValues(player)) : [];
  }
  const unplayable = input.cards.filter((card) => !isIProjectCard(card) || !player.canPlay(card));
  if (unplayable.length === 0) {
    return [];
  }
  // Also: keep the cards that bring the most points with the sale money, sell the rest (lastGenerationSale.ts).
  const planned = tuningOf(player).lastGenerationSale > 0 && !isSimulating() ? lastGenerationSaleResponses(player) : [];
  return [{type: 'card', cards: unplayable.map((card) => card.name)}, ...planned];
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
      .map((card) => ({type: 'projectCard', card: card.name, payment: cardPayment(player, card, input.extras.get(card.name)?.overriddenCost)}));
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
    // awardFundingLead: no funding of awards the player does not lead (awardFunding.ts).
    // Moves without any effect (convert heat at maximum temperature …) never compete with passing (uselessMove.ts).
    for (const response of responsesFor(option, player).filter((inner) => fundingAllowed(option, inner, player) && !isUselessMove(option, inner))) {
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
  /** Titles of the options of an OR question asked right after the move (only when no plan was given). */
  followUpTitles?: Array<string>,
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
    const titles = candidate.followUps === undefined ? followUpChoices(copyPlayer.getWaitingFor(), copyPlayer)?.map((choice) => choice.title) : undefined;
    finishMove(copy, copyPlayer, candidate.followUps);
    // milestoneReserve: a move that leaves a reached milestone without the claim money loses part of it (milestoneReserve.ts).
    const value = relativeValue(copyPlayer, context) - milestoneReservePenalty(copyPlayer);
    const nextMenu = copyPlayer.getWaitingFor();
    if (!withNext || !isActionMenu(nextMenu) || copy.generation !== generation) {
      return {value, snapshot: withNext ? snapshotOf(copy) : undefined, followUpTitles: titles};
    }
    const snapshotAfter = snapshotOf(copy);
    return {value, snapshot: snapshotAfter, next: {snapshot: snapshotAfter, menuSize: nextMenu.options.length, candidates: candidatesFor(nextMenu, copyPlayer)}, followUpTitles: titles};
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
  const keptMoney = tuning.passPenalty > 0 && remainingProductionPhases(player.game, player) > 0 ? tuning.passPenalty * Math.min(player.megaCredits, 40) : 0;
  // Human advice: passing is the last option – first sell, play or use whatever is left. A fixed
  // amount (aiTuning.ts passLastResort) so that near-ties and noise no longer end the turn, in every
  // generation including the last one.
  return keptMoney + tuning.passLastResort;
}

/** Rollout policy of a tuning: greedy over a few moves, or quick rules without copies (undefined). */
function rolloutPolicy(moves: number, opponentMoves: number, deciderId: string): RolloutPolicy {
  // Opponents may play by cheaper rules than the deciding player: their moves matter less for the ranking.
  const movesFor = (player: IPlayer) => player.id === deciderId || opponentMoves < 0 ? moves : opponentMoves;
  return (menu, player) => {
    const count = movesFor(player);
    return count > 0 ? greedyAction(menu, player, count) : undefined;
  };
}

/** Decisions where playing on pays off: passing, milestone and award races. */
function isKeyMove(menu: OrOptions, response: InputResponse): boolean {
  const option = response.type === 'or' ? menu.options[response.index] : undefined;
  if (option === undefined) {
    return false;
  }
  const title = typeof option.title === 'string' ? option.title : option.title.message;
  return title === 'Pass for this generation' || title === 'Claim a milestone' || title.startsWith('Fund an award');
}

/** The hand card a move plays, if any. */
function playedHandCard(response: InputResponse, player: IPlayer): CardName | undefined {
  const inner = response.type === 'or' ? response.response : undefined;
  if (inner?.type !== 'projectCard') {
    return undefined;
  }
  return player.cardsInHand.some((card) => card.name === inner.card) ? inner.card as CardName : undefined;
}

function isSellPatents(menu: OrOptions, response: InputResponse): boolean {
  const option = response.type === 'or' ? menu.options[response.index] : undefined;
  return option instanceof SelectCard && option.title === 'Sell patents';
}

function isPass(menu: OrOptions, response: InputResponse): boolean {
  const option = response.type === 'or' ? menu.options[response.index] : undefined;
  return option instanceof SelectOption && option.title === 'Pass for this generation';
}

function isEndTurn(menu: OrOptions, response: InputResponse): boolean {
  const option = response.type === 'or' ? menu.options[response.index] : undefined;
  return option instanceof SelectOption && option.title === 'End Turn';
}

/** Fast move choice inside rollouts: one step, a few moves, no hand values and no reply. */
export function greedyAction(menu: OrOptions, player: IPlayer, moves = GREEDY_CANDIDATES): InputResponse | undefined {
  const snapshot = snapshotOf(player.game);
  const context = valuationContext(player.game, player);
  const penalty = passPenaltyFor(player);
  let best: {response: InputResponse, value: number} | undefined;
  for (const candidate of candidatesFor(menu, player).slice(0, moves)) {
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
  const baseContext = valuationContext(player.game, player);
  const context = {...baseContext, handValues: handCardValues(player), handOwner: player.id,
    handReadiness: tuningOf(player).needsPursuit > 0 ? handReadinessMap(player, baseContext.remaining) : undefined,
    handOutlook: handOutlookMap(player)};
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

  const tuning = tuningOf(player);
  // Follow-up choice: a move that asks an OR question right away (e.g. which resource to gain) is
  // tried once per option instead of only with the quick rule's first option.
  if (tuning.followUpChoice > 0) {
    for (const entry of [...tried]) {
      const titles = entry.outcome.followUpTitles;
      if (titles === undefined) {
        continue;
      }
      for (let index = 0; index < titles.length && !outOfTime(); index++) {
        const candidate: Candidate = {...entry.candidate, followUps: [index]};
        const outcome = tryCandidate(snapshot, player, menu.options.length, candidate, context, true);
        if (outcome !== undefined) {
          outcome.followUpTitles = [titles[index]];
          tried.push({candidate, outcome});
        }
      }
    }
  }

  // Second step for the best few first moves that leave an action in this turn.
  // A sale alone loses value; it only pays with the claim after it, so it always gets a second step.
  const ranked = [...tried].sort((a, b) => b.outcome.value - a.outcome.value);
  const promising = [...ranked.slice(0, tuning.secondStepCandidates),
    ...ranked.slice(tuning.secondStepCandidates).filter((entry) => isSellPatents(menu, entry.candidate.response))];
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

  // passFairness: the one-move values before replies and rollouts re-rank anything (passFairness.ts).
  const plainValues = tuning.passFairness > 0 ? new Map(tried.map((entry) => [entry.candidate, entry.outcome.value])) : undefined;

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
    // Focus: ordinary moves are judged well enough by the plain value; races and passing are not.
    const focused = tuning.rolloutFocus <= 0 || remainingProductionPhases(player.game, player) <= 1 ||
      finalists.some((entry) => isKeyMove(menu, entry.candidate.response));
    if (focused && finalists.length > 1 && entries.length === finalists.length) {
      const means = rolloutMeans(entries, player.id, rolloutPolicy(tuning.rolloutPolicyMoves, tuning.rolloutOpponentPolicyMoves, player.id), rolloutBudget, MINIMUM_ROLLOUTS, tuning.rolloutMaximumRounds, tuning.rolloutHorizon);
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

  // Play order: an effect card goes before the hand cards that trigger it (triggerOrder.ts).
  // Applied after the re-ranking, which would otherwise drop it.
  if (tuning.triggerOrderPenalty > 0 || tuning.triggerOrderBonus > 0) {
    const playable = new Set<CardName>();
    for (const {candidate} of tried) {
      const name = playedHandCard(candidate.response, player);
      if (name !== undefined) {
        playable.add(name);
      }
    }
    const adjustments = triggerOrderAdjustments(snapshot, player, context, playable, tuning.triggerOrderPenalty, tuning.triggerOrderBonus);
    if (adjustments.size > 0) {
      for (const {candidate, outcome} of tried) {
        const name = playedHandCard(candidate.response, player);
        outcome.value += name === undefined ? 0 : adjustments.get(name) ?? 0;
      }
    }
  }

  // Play order of strong players (learned from BGA games): which of the playable hand cards goes first.
  if (tuning.playPolicyWeight > 0) {
    const playable = new Set<CardName>();
    for (const {candidate} of tried) {
      const name = playedHandCard(candidate.response, player);
      if (name !== undefined) {
        playable.add(name);
      }
    }
    const preferences = playPreferences(player, playable);
    if (preferences.size > 0) {
      for (const {candidate, outcome} of tried) {
        const name = playedHandCard(candidate.response, player);
        outcome.value += name === undefined ? 0 : preferences.get(name) ?? 0;
      }
    }
  }

  // cheapFirst: of several playable hand cards the cheap ones go first, like humans do (cheapFirst.ts);
  // drawEngineValue: draw engines go early anyway, every generation of delay loses their draws (drawEngineValue.ts).
  if (tuning.cheapFirst > 0 || tuning.drawEngineValue > 0) {
    const playable = new Set<CardName>();
    for (const {candidate} of tried) {
      const name = playedHandCard(candidate.response, player);
      if (name !== undefined) {
        playable.add(name);
      }
    }
    for (const {candidate, outcome} of tried) {
      const name = playedHandCard(candidate.response, player);
      outcome.value -= name === undefined ? 0 : cheapFirstPenalty(player, name, playable);
      outcome.value += name === undefined ? 0 : drawEngineTimingBonus(player, name, playable);
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

  // standardProjectRestraint: hand cards first, standard projects stay available later in the generation.
  const standardPenalty = standardProjectPenalty(player, tried.some(({candidate}) => playedHandCard(candidate.response, player) !== undefined));
  if (standardPenalty > 0) {
    for (const {candidate, outcome} of tried) {
      if (isStandardProject(menu, candidate.response)) {
        outcome.value -= standardPenalty;
      }
    }
  }

  // cityFirstAction: while own cities do not lead, the city goes first and plants wait for it (cityFirstAction.ts).
  if (tuning.cityFirstAction > 0) {
    for (const {candidate, outcome} of tried) {
      outcome.value += cityFirstActionAdjustment(player, menu, candidate.response);
    }
  }

  // turnTempo (strategy guides): after one action, ending the turn keeps the other moves for later,
  // when the opponent's reply is known; only a clear gain (races, plant conversion) is worth acting now.
  // Not in the last generation: there every move left undone may be lost.
  if (tuning.turnTempo > 0 && remainingProductionPhases(player.game, player) > 0) {
    for (const {candidate, outcome} of tried) {
      if (isEndTurn(menu, candidate.response)) {
        outcome.value += tuning.turnTempo;
      }
    }
  }

  if (plainValues !== undefined) {
    capAgainstPass(tried, plainValues, relativeValue(player, context), (candidate) => isPass(menu, candidate.response));
  }

  let best: {candidate: Candidate, value: number} | undefined;
  for (const {candidate, outcome} of tried) {
    options.onEvaluated?.(candidate.response, outcome.value);
    const judged = outcome.value + options.noise * gaussian(random);
    if (best === undefined || judged > best.value) {
      best = {candidate, value: judged};
    }
  }
  // The real game asks the follow-up question after this move: answer it as planned (chooseResponse.ts).
  // Copies share the player ids, so only the real game keeps a plan.
  if (!isSimulating()) {
    if (best?.candidate.followUps !== undefined) {
      setFollowUpPlan(player, best.candidate.followUps);
    } else {
      clearFollowUpPlan(player);
    }
  }
  if (isTracingDecision()) {
    // The best moves and the chosen one; the rest would only bloat the trace.
    const ranked = [...tried].sort((a, b) => b.outcome.value - a.outcome.value);
    const shown = ranked.filter((entry, index) => index < TRACED_ACTION_OPTIONS || entry.candidate === best?.candidate);
    traceOptions('action', shown.map((entry) => ({
      label: describeResponse(menu, entry.candidate.response, player.game) +
        (entry.candidate.followUps !== undefined && entry.outcome.followUpTitles !== undefined ? ` → ${entry.outcome.followUpTitles[0]}` : ''),
      value: Math.round(entry.outcome.value * 10) / 10,
      chosen: entry.candidate === best?.candidate,
    })), {candidates: candidatesFor(menu, player).length, tried: tried.length, milliseconds: Math.round(performance.now() - start)});
  }
  return best?.candidate.response;
}
