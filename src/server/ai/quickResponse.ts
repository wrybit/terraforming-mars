import {PlayerInput} from '../PlayerInput';
import {IPlayer} from '../IPlayer';
import {InputResponse} from '../../common/inputs/InputResponse';
import {OrOptions} from '../inputs/OrOptions';
import {AndOptions} from '../inputs/AndOptions';
import {SelectOption} from '../inputs/SelectOption';
import {SelectCard} from '../inputs/SelectCard';
import {SelectCardToPlay} from '../inputs/SelectCardToPlay';
import {SelectSpace} from '../inputs/SelectSpace';
import {SelectPlayer} from '../inputs/SelectPlayer';
import {SelectAmount} from '../inputs/SelectAmount';
import {SelectPayment} from '../inputs/SelectPayment';
import {SelectProductionToLose} from '../inputs/SelectProductionToLose';
import {SelectResource} from '../inputs/SelectResource';
import {SelectResources} from '../inputs/SelectResources';
import {UndoActionOption} from '../inputs/UndoActionOption';
import {Units} from '../../common/Units';
import {Tag} from '../../common/cards/Tag';
import {PRODUCTION_MINIMUMS} from '../../common/constants';
import {randomResponse} from './randomResponse';
import {greedyPayment} from './greedyPayment';
import {spaceValue, tileKindOf} from './spaceValue';
import {cardPrior} from './cardPriors';

// Fast, rule-based answers for inputs the AI cannot try out on a game copy: follow-up questions
// in the middle of an action (where to place a tile, whom to target, ...). Also used to finish
// moves inside game copies. Anything not covered falls back to a random valid answer.

const SKIP_WORDS = ['skip', 'do nothing', 'don\'t', 'do not', 'none'];

function titleOf(input: PlayerInput): string {
  const title = input.title;
  return (typeof title === 'string' ? title : title.message).toLowerCase();
}

function isSkipLike(input: PlayerInput): boolean {
  const title = titleOf(input);
  return SKIP_WORDS.some((word) => title.includes(word));
}

// Losing production: give up what is worth least first.
const PRODUCTION_LOSS_ORDER: ReadonlyArray<keyof Units> = ['heat', 'energy', 'megacredits', 'steel', 'plants', 'titanium'];

function productionToLose(input: SelectProductionToLose, player: IPlayer): InputResponse {
  const production = player.production.asUnits();
  const units: Units = {...Units.EMPTY};
  let remaining = input.unitsToLose;
  for (const key of PRODUCTION_LOSS_ORDER) {
    const taken = Math.min(production[key] - PRODUCTION_MINIMUMS[key], remaining);
    if (taken > 0) {
      units[key] = taken;
      remaining -= taken;
    }
  }
  return {type: 'productionToLose', units};
}

// Gaining a resource of free choice: most valuable first.
const RESOURCE_PREFERENCE: ReadonlyArray<keyof Units> = ['titanium', 'plants', 'steel', 'megacredits', 'heat', 'energy'];

export function quickResponse(input: PlayerInput, player: IPlayer): InputResponse {
  if (input instanceof OrOptions) {
    // Prefer the first real option (usually "do it"), skip undo and "do nothing" options.
    const index = input.options.findIndex((option) => !(option instanceof UndoActionOption) && !isSkipLike(option));
    const chosen = index >= 0 ? index : input.options.findIndex((option) => !(option instanceof UndoActionOption));
    return {type: 'or', index: chosen, response: quickResponse(input.options[chosen], player)};
  }
  if (input instanceof AndOptions) {
    return {type: 'and', responses: input.options.map((option) => quickResponse(option, player))};
  }
  if (input instanceof SelectOption) {
    return {type: 'option'};
  }
  if (input instanceof SelectCardToPlay) {
    const cards = input.cards.filter((_card, index) => input.enabled?.[index] !== false);
    const card = [...cards].sort((a, b) => cardPrior(b.name) - cardPrior(a.name))[0];
    return {type: 'projectCard', card: card.name, payment: greedyPayment(player, player.getCardCost(card), {
      steel: card.tags.includes(Tag.BUILDING), titanium: card.tags.includes(Tag.SPACE), heat: player.canUseHeatAsMegaCredits,
    })};
  }
  if (input instanceof SelectCard) {
    // Cards that score VP (e.g. resource targets) first, then the statistically strongest.
    const candidates = input.cards.filter((_card, index) => input.config.enabled?.[index] !== false);
    const sorted = [...candidates].sort((a, b) =>
      (Number(b.victoryPoints !== undefined) - Number(a.victoryPoints !== undefined)) || (cardPrior(b.name) - cardPrior(a.name)));
    const count = Math.min(Math.max(input.config.min, 0), sorted.length);
    return {type: 'card', cards: sorted.slice(0, count).map((card) => card.name)};
  }
  if (input instanceof SelectSpace) {
    const kind = tileKindOf(input);
    const best = [...input.spaces].sort((a, b) => spaceValue(b, kind, player) - spaceValue(a, kind, player))[0];
    return {type: 'space', spaceId: best.id};
  }
  if (input instanceof SelectPlayer) {
    // Target the strongest opponent; only pick ourselves when nothing else is allowed.
    const opponents = input.players.filter((candidate) => candidate !== player);
    const pool = opponents.length > 0 ? opponents : input.players;
    const target = [...pool].sort((a, b) => b.getVictoryPoints().total - a.getVictoryPoints().total)[0];
    return {type: 'player', player: target.color};
  }
  if (input instanceof SelectAmount) {
    return {type: 'amount', amount: input.max};
  }
  if (input instanceof SelectPayment) {
    return {type: 'payment', payment: greedyPayment(player, input.amount, {
      steel: input.paymentOptions.steel === true,
      titanium: input.paymentOptions.titanium === true,
      heat: player.canUseHeatAsMegaCredits || input.paymentOptions.heat === true,
    })};
  }
  if (input instanceof SelectProductionToLose) {
    return productionToLose(input, player);
  }
  if (input instanceof SelectResource) {
    const resource = RESOURCE_PREFERENCE.find((key) => input.include.includes(key)) ?? input.include[0];
    return {type: 'resource', resource};
  }
  if (input instanceof SelectResources) {
    return {type: 'resources', units: Units.of({plants: input.count})};
  }
  return randomResponse(input, player, Math.random);
}
