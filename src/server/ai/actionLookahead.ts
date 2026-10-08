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
import {GameSnapshot, finishMove, isActionMenu, snapshotOf, withCopy} from './gameCopy';
import {ValuationContext, relativeValue, valuationContext} from './stateValue';

// Decides an action-phase move by playing every candidate move on a copy of the game and
// valuing the resulting position (one-step lookahead). This captures the effect of any card
// without card-specific code.

/** Time the AI may spend on one action on the server (AK1: ~10 ms per tried move). */
const DEFAULT_BUDGET_MILLISECONDS = 2000;
const MAXIMUM_CANDIDATES = 120;

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
  if (remainingProductionPhases(player.game) > 0) {
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

function valueOfCandidate(snapshot: GameSnapshot, player: IPlayer, menuSize: number, candidate: Candidate, context: ValuationContext): number | undefined {
  return withCopy(snapshot, (copy) => {
    const copyPlayer = copy.getPlayerById(player.id);
    const menu = copyPlayer.getWaitingFor();
    // The copy must offer the same menu, otherwise the option indices would mean something else.
    if (!isActionMenu(menu) || menu.options.length !== menuSize) {
      return undefined;
    }
    try {
      copyPlayer.process(candidate.response);
    } catch {
      return undefined;
    }
    finishMove(copy, copyPlayer);
    return relativeValue(copyPlayer, context);
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

export function chooseAction(menu: OrOptions, player: IPlayer, options: LookaheadOptions): InputResponse | undefined {
  const start = performance.now();
  const budget = options.budgetMilliseconds ?? DEFAULT_BUDGET_MILLISECONDS;
  const random = options.random ?? Math.random;
  const snapshot = snapshotOf(player.game);
  const context = valuationContext(player.game);
  let best: {response: InputResponse, value: number} | undefined;
  for (const candidate of candidatesFor(menu, player)) {
    if (best !== undefined && performance.now() - start > budget) {
      break;
    }
    const value = valueOfCandidate(snapshot, player, menu.options.length, candidate, context);
    if (value === undefined) {
      continue;
    }
    options.onEvaluated?.(candidate.response, value);
    const judged = value + options.noise * gaussian(random);
    if (best === undefined || judged > best.value) {
      best = {response: candidate.response, value: judged};
    }
  }
  return best?.response;
}
