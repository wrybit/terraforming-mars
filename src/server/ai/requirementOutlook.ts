import {IPlayer} from '../IPlayer';
import {IProjectCard} from '../cards/IProjectCard';
import {CardRequirementDescriptor} from '../../common/cards/CardRequirementDescriptor';
import {CardRequirements} from '../cards/requirements/CardRequirements';
import {MAX_OCEAN_TILES, MAX_OXYGEN_LEVEL, MAX_TEMPERATURE, MIN_TEMPERATURE, MAX_VENUS_SCALE} from '../../common/constants';
import {remainingProductionPhases} from './gameProgress';

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
    const expected = fromHand * 0.7 + remaining * TAGS_PER_GENERATION;
    return missing <= expected ? Math.max(0.15, 0.85 - 0.15 * missing) : 0.05;
  }
  if (descriptor.production !== undefined) {
    // Production can be bought (e.g. power plant), but it costs extra.
    return 0.5;
  }
  return 0.35;
}

export function requirementOutlook(card: IProjectCard, player: IPlayer): number {
  const remaining = remainingProductionPhases(player.game);
  return card.requirements.reduce((product, descriptor) => product * outlookOf(descriptor, player, card, remaining), 1);
}
