import {PlayerInput} from '../PlayerInput';
import {IPlayer} from '../IPlayer';
import {InputResponse} from '../../common/inputs/InputResponse';
import {OrOptions} from '../inputs/OrOptions';
import {AndOptions} from '../inputs/AndOptions';
import {SelectInitialCards} from '../inputs/SelectInitialCards';
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
import {SelectColony} from '../inputs/SelectColony';
import {SelectParty} from '../inputs/SelectParty';
import {SelectDelegate} from '../inputs/SelectDelegate';
import {ICard} from '../cards/ICard';
import {isICorporationCard} from '../cards/corporation/ICorporationCard';
import {isIStandardProjectCard} from '../cards/IStandardProjectCard';
import {IProjectCard} from '../cards/IProjectCard';
import {Tag} from '../../common/cards/Tag';
import {Units} from '../../common/Units';
import {PRODUCTION_MINIMUMS} from '../../common/constants';
import {RandomSource, integerBetween, pickOne, pickSome} from './randomChoice';
import {greedyPayment} from './greedyPayment';

/** Thrown for input types the random player cannot answer yet (mostly fan expansions). */
export class UnsupportedInputError extends Error {}

// Options that end a player's turn or generation. A uniformly random player would pick them
// far too often and a game would never finish, so they are only chosen with a small probability.
const TURN_ENDING_TITLES = new Set(['Pass for this generation', 'End Turn']);
const TURN_ENDING_PROBABILITY = 0.05;

function enabledItems<T>(items: ReadonlyArray<T>, enabled: ReadonlyArray<boolean> | undefined): Array<T> {
  return items.filter((_item, index) => enabled?.[index] !== false);
}

/** False if an option obviously cannot be answered (e.g. "Standard projects" with none affordable). */
function hasAnyChoice(option: PlayerInput): boolean {
  if (option instanceof SelectCardToPlay) {
    return enabledItems(option.cards, option.enabled).length > 0;
  }
  if (option instanceof SelectCard) {
    return enabledItems(option.cards, option.config.enabled).length >= option.config.min;
  }
  if (option instanceof SelectSpace) {
    return option.spaces.length > 0;
  }
  return true;
}

function chooseOrOptionIndex(input: OrOptions, random: RandomSource): number {
  const indices = input.options
    .map((_option, index) => index)
    .filter((index) => hasAnyChoice(input.options[index]));
  const isTurnEnding = (index: number) => {
    const title = input.options[index].title;
    return typeof title === 'string' && TURN_ENDING_TITLES.has(title);
  };
  const regular = indices.filter((index) => !isTurnEnding(index));
  if (regular.length === 0 || random() < TURN_ENDING_PROBABILITY) {
    return pickOne(random, indices);
  }
  return pickOne(random, regular);
}

function cardToPlayCost(input: SelectCardToPlay<any>, card: IProjectCard, player: IPlayer): number {
  if (isIStandardProjectCard(card)) {
    return input.extras.get(card.name)?.overriddenCost ?? card.cost;
  }
  return player.getCardCost(card);
}

function initialCardsResponse(input: SelectInitialCards, player: IPlayer, random: RandomSource): InputResponse {
  // The project-card count depends on the chosen corporation's starting M€, otherwise the
  // engine rejects the whole selection ("Too many cards selected").
  let startingMegaCredits = 0;
  let cardCost = player.cardCost;
  const responses = input.options.map((option): InputResponse => {
    if (option === input.inputs.corp && option instanceof SelectCard) {
      const corporation = pickOne(random, option.cards as ReadonlyArray<ICard>);
      if (isICorporationCard(corporation)) {
        startingMegaCredits = corporation.startingMegaCredits;
        cardCost = corporation.cardCost ?? cardCost;
      }
      return {type: 'card', cards: [corporation.name]};
    }
    if (option === input.inputs.project && option instanceof SelectCard) {
      const affordable = Math.min(option.config.max, Math.floor(startingMegaCredits / cardCost));
      const count = integerBetween(random, 0, affordable);
      return {type: 'card', cards: pickSome(random, option.cards, count).map((card) => card.name)};
    }
    return randomResponse(option, player, random);
  });
  return {type: 'initialCards', responses};
}

function productionToLoseResponse(input: SelectProductionToLose, player: IPlayer, random: RandomSource): InputResponse {
  const production = player.production.asUnits();
  const units: Units = {...Units.EMPTY};
  let remaining = input.unitsToLose;
  for (const key of pickSome(random, Units.keys, Units.keys.length)) {
    const available = production[key] - PRODUCTION_MINIMUMS[key];
    const taken = Math.min(available, remaining);
    units[key] = taken;
    remaining -= taken;
  }
  return {type: 'productionToLose', units};
}

/**
 * Builds a random (but structurally valid) answer for any player input.
 * Validity against the game rules is checked by the engine; on an InputError the caller
 * simply asks for another random answer.
 */
export function randomResponse(input: PlayerInput, player: IPlayer, random: RandomSource): InputResponse {
  // SelectInitialCards must be checked before AndOptions-like handling.
  if (input instanceof SelectInitialCards) {
    return initialCardsResponse(input, player, random);
  }
  if (input instanceof OrOptions) {
    const index = chooseOrOptionIndex(input, random);
    return {type: 'or', index, response: randomResponse(input.options[index], player, random)};
  }
  if (input instanceof AndOptions) {
    return {type: 'and', responses: input.options.map((option) => randomResponse(option, player, random))};
  }
  if (input instanceof SelectOption) {
    return {type: 'option'};
  }
  if (input instanceof SelectCardToPlay) {
    const card = pickOne(random, enabledItems(input.cards, input.enabled)) as IProjectCard;
    const tags = card.tags ?? [];
    const payment = greedyPayment(player, cardToPlayCost(input, card, player), {
      steel: tags.includes(Tag.BUILDING),
      titanium: tags.includes(Tag.SPACE),
      heat: player.canUseHeatAsMegaCredits,
    });
    return {type: 'projectCard', card: card.name, payment};
  }
  if (input instanceof SelectCard) {
    const candidates = enabledItems(input.cards, input.config.enabled);
    const count = integerBetween(random, input.config.min, Math.min(input.config.max, candidates.length));
    return {type: 'card', cards: pickSome(random, candidates, count).map((card) => card.name)};
  }
  if (input instanceof SelectSpace) {
    return {type: 'space', spaceId: pickOne(random, input.spaces).id};
  }
  if (input instanceof SelectPlayer) {
    return {type: 'player', player: pickOne(random, input.players).color};
  }
  if (input instanceof SelectAmount) {
    return {type: 'amount', amount: integerBetween(random, input.min, input.max)};
  }
  if (input instanceof SelectPayment) {
    const payment = greedyPayment(player, input.amount, {
      steel: input.paymentOptions.steel === true,
      titanium: input.paymentOptions.titanium === true,
      heat: player.canUseHeatAsMegaCredits || input.paymentOptions.heat === true,
    });
    return {type: 'payment', payment};
  }
  if (input instanceof SelectProductionToLose) {
    return productionToLoseResponse(input, player, random);
  }
  if (input instanceof SelectResource) {
    return {type: 'resource', resource: pickOne(random, input.include)};
  }
  if (input instanceof SelectResources) {
    return {type: 'resources', units: Units.of({[pickOne(random, Units.keys)]: input.count})};
  }
  if (input instanceof SelectColony) {
    return {type: 'colony', colonyName: pickOne(random, input.colonies).name};
  }
  if (input instanceof SelectParty) {
    return {type: 'party', partyName: pickOne(random, input.parties)};
  }
  if (input instanceof SelectDelegate) {
    const delegate = pickOne(random, input.players);
    return {type: 'delegate', player: typeof delegate === 'string' ? delegate : delegate.color};
  }
  throw new UnsupportedInputError(`Unsupported input type: ${input.type}`);
}
