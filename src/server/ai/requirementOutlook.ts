import {IPlayer} from '../IPlayer';
import {IProjectCard} from '../cards/IProjectCard';
import {CardRequirementDescriptor} from '../../common/cards/CardRequirementDescriptor';
import {CardRequirements} from '../cards/requirements/CardRequirements';
import {MAX_OCEAN_TILES, MAX_OXYGEN_LEVEL, MAX_TEMPERATURE, MIN_TEMPERATURE, MAX_VENUS_SCALE} from '../../common/constants';
import {remainingProductionPhases} from './gameProgress';
import {tuningOf} from './aiTuning';
import {Tag} from '../../common/cards/Tag';

// How likely a card's requirements will be met while it is still useful (0..1).
// The AI bought cards like Anti-Gravity Technology (7 science tags) with no science at all and
// kept a hand full of cards it could never play.

/** Typical game length in generations (see gameProgress.ts). */
const GAME_LENGTH = 12;
// Tags of one kind a player typically adds per generation (about two cards, a few tag kinds).
const TAGS_PER_GENERATION = 0.3;

function isMet(descriptor: CardRequirementDescriptor, player: IPlayer, card: IProjectCard): boolean {
  try {
    return CardRequirements.compile([descriptor]).satisfies(player, card);
  } catch {
    return true;
  }
}

/** Generations until a global parameter reaches `steps` more steps at the usual pace. */
function generationsUntil(stepsNeeded: number, totalSteps: number): number {
  return stepsNeeded / (totalSteps / GAME_LENGTH);
}

function globalOutlook(stepsNeeded: number, totalSteps: number, remaining: number): number {
  const wait = generationsUntil(stepsNeeded, totalSteps);
  if (wait >= remaining) {
    return 0.05;
  }
  // The longer the wait, the less of the card's life is left.
  return Math.max(0.1, 0.9 * (1 - wait / Math.max(1, remaining)));
}

/** Cards a player plays per generation, from the own pace so far (at least 1, at most 4). */
function cardsPerGeneration(player: IPlayer): number {
  const generations = Math.max(1, player.game.generation - 1);
  return Math.min(4, Math.max(1, player.playedCards.length / generations));
}

/**
 * Tags of one kind a player may expect per generation: the tag's share of the game's project deck
 * (public: the deck's make-up) times the own play pace, or the own pace with
 * that tag so far when higher (a science player finds science faster).
 */
function tagsPerGeneration(tag: Tag, player: IPlayer): number {
  const deck = player.game.projectDeck;
  // The whole project deck of this game: which cards are still unseen is hidden, the make-up not.
  const cards = [...deck.drawPile, ...deck.discardPile, ...player.game.players.flatMap((other) => [...other.cardsInHand, ...other.playedCards])];
  const share = cards.length === 0 ? 0 : cards.filter((card) => card.tags.includes(tag)).length / cards.length;
  const generations = Math.max(1, player.game.generation - 1);
  const ownPace = player.tags.count(tag, 'raw') / generations;
  return Math.max(share * cardsPerGeneration(player), ownPace);
}

function outlookOf(descriptor: CardRequirementDescriptor, player: IPlayer, card: IProjectCard, remaining: number): number {
  if (isMet(descriptor, player, card)) {
    return 1;
  }
  // A maximum that is already exceeded never comes back.
  if (descriptor.max === true) {
    return 0;
  }
  const game = player.game;
  const count = descriptor.count ?? 1;
  if (descriptor.oxygen !== undefined) {
    return globalOutlook(descriptor.oxygen - game.getOxygenLevel(), MAX_OXYGEN_LEVEL, remaining);
  }
  if (descriptor.temperature !== undefined) {
    return globalOutlook((descriptor.temperature - game.getTemperature()) / 2, (MAX_TEMPERATURE - MIN_TEMPERATURE) / 2, remaining);
  }
  if (descriptor.oceans !== undefined) {
    return globalOutlook(descriptor.oceans - game.board.getOceanSpaces().length, MAX_OCEAN_TILES, remaining);
  }
  if (descriptor.venus !== undefined) {
    return globalOutlook((descriptor.venus - game.getVenusScaleLevel()) / 2, MAX_VENUS_SCALE / 2, remaining);
  }
  const tag = descriptor.tag;
  if (tag !== undefined) {
    const missing = count - player.tags.count(tag);
    const fromHand = player.cardsInHand.filter((handCard) => handCard !== card && handCard.tags.includes(tag)).length;
    const perGeneration = tuningOf(player).tagRateModel > 0 ? tagsPerGeneration(tag, player) : TAGS_PER_GENERATION;
    const expected = fromHand * 0.7 + remaining * perGeneration;
    return missing <= expected ? Math.max(0.15, 0.85 - 0.15 * missing) : 0.05;
  }
  if (descriptor.production !== undefined) {
    // Production can be bought (e.g. power plant), but it costs extra.
    return 0.5;
  }
  return 0.35;
}

/** Generations until the unmet global requirements of a card are reached at the usual pace. */
export function globalWait(card: IProjectCard, player: IPlayer): number {
  const game = player.game;
  let wait = 0;
  for (const descriptor of card.requirements) {
    if (descriptor.max === true || isMet(descriptor, player, card)) {
      continue;
    }
    if (descriptor.temperature !== undefined) {
      wait = Math.max(wait, generationsUntil((descriptor.temperature - game.getTemperature()) / 2, (MAX_TEMPERATURE - MIN_TEMPERATURE) / 2));
    }
    if (descriptor.oxygen !== undefined) {
      wait = Math.max(wait, generationsUntil(descriptor.oxygen - game.getOxygenLevel(), MAX_OXYGEN_LEVEL));
    }
  }
  return wait;
}

/**
 * Ocean cards that must wait for temperature or oxygen (Permafrost Extraction, Lake Marineris,
 * Ice Cap Melting) often found all oceans placed when they became playable: in a test batch
 * about 25 of them per 100 games stayed in hand.
 */
function oceanRaceOutlook(card: IProjectCard, player: IPlayer): number {
  if (card.behavior?.ocean === undefined) {
    return 1;
  }
  const oceansLeft = MAX_OCEAN_TILES - player.game.board.getOceanSpaces().length;
  if (oceansLeft <= 0) {
    // Already full: the value measured on the game copy contains no ocean any more.
    return 1;
  }
  const wait = globalWait(card, player);
  if (wait === 0) {
    return 1;
  }
  const generationsUntilOceansFull = generationsUntil(oceansLeft, MAX_OCEAN_TILES);
  return Math.max(0.05, Math.min(1, 1 - wait / generationsUntilOceansFull));
}

/**
 * Cards with a maximum requirement (e.g. at most 5 % oxygen) that are playable now: how much of
 * a delay of `delay` generations the window still lasts (1 = open long enough).
 */
export function closingWindowFactor(card: IProjectCard, player: IPlayer, delay: number): number {
  const game = player.game;
  let factor = 1;
  for (const descriptor of card.requirements) {
    if (descriptor.max !== true || !isMet(descriptor, player, card)) {
      continue;
    }
    let generationsOpen = Number.POSITIVE_INFINITY;
    if (descriptor.oxygen !== undefined) {
      generationsOpen = generationsUntil(descriptor.oxygen - game.getOxygenLevel() + 1, MAX_OXYGEN_LEVEL);
    } else if (descriptor.temperature !== undefined) {
      generationsOpen = generationsUntil((descriptor.temperature - game.getTemperature()) / 2 + 1, (MAX_TEMPERATURE - MIN_TEMPERATURE) / 2);
    } else if (descriptor.oceans !== undefined) {
      generationsOpen = generationsUntil(descriptor.oceans - game.board.getOceanSpaces().length + 1, MAX_OCEAN_TILES);
    }
    factor = Math.min(factor, Math.min(1, generationsOpen / Math.max(1, delay)));
  }
  return factor;
}

export function requirementOutlook(card: IProjectCard, player: IPlayer): number {
  const remaining = remainingProductionPhases(player.game, player);
  return card.requirements.reduce((product, descriptor) => product * outlookOf(descriptor, player, card, remaining), 1) *
    oceanRaceOutlook(card, player);
}
