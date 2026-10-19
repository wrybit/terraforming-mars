import {IPlayer} from '../IPlayer';
import {Tag} from '../../common/cards/Tag';
import {Resource} from '../../common/Resource';
import modelData from './data/bgaValueModel.json';
import {Tree, treeScore} from './treeEnsemble';

// Learned position value for two-player games: a gradient-boosted tree model (LightGBM) trained on about
// 43,000 two-player games from Board Game Arena estimates the final VP margin from a position. VP that are already
// certain (TR, VP on cards, tiles, milestones, awards) count one to one; the trees add what usually follows
// (production, resources, hand, cards in play, tags, global parameters), with more own production or resources
// never worse. Trees and feature order come from data/bgaValueModel.json (exported by the private test system).

type ModelData = {features: Array<string>, surePoints: Array<number>, trees: Array<Tree>};
const MODEL = modelData as unknown as ModelData;
/** Feature names in the order of bgaFeatures (self-play data: our own games recorded in the same format). */
export const BGA_VALUE_FEATURES: ReadonlyArray<string> = MODEL.features;

type PlayerFeature = (player: IPlayer, points: ReturnType<IPlayer['getVictoryPoints']>) => number;
const TAGS: Record<string, Tag> = {
  buildingTags: Tag.BUILDING, spaceTags: Tag.SPACE, scienceTags: Tag.SCIENCE, powerTags: Tag.POWER, earthTags: Tag.EARTH,
  jovianTags: Tag.JOVIAN, plantTags: Tag.PLANT, microbeTags: Tag.MICROBE, animalTags: Tag.ANIMAL, cityTags: Tag.CITY,
};
const RESOURCES: Record<string, Resource> = {
  megacredits: Resource.MEGACREDITS, steel: Resource.STEEL, titanium: Resource.TITANIUM, plants: Resource.PLANTS,
  energy: Resource.ENERGY, heat: Resource.HEAT,
};
const PLAYER_FEATURES: Record<string, PlayerFeature> = {
  hand: (player) => player.cardsInHand.length,
  // BGA counts every card in the player area, events included (as our tableau does)
  tableau: (player) => player.tableau.length,
  events: (player) => player.getPlayedEventsCount(),
  tr: (player) => player.terraformRating,
  cards: (_player, points) => points.victoryPoints,
  greeneries: (_player, points) => points.greenery,
  cities: (_player, points) => points.city,
  milestones: (_player, points) => points.milestones,
  awards: (_player, points) => points.awards,
};
for (const [name, resource] of Object.entries(RESOURCES)) {
  PLAYER_FEATURES[name] = (player) => player.stock.get(resource);
  // megacredits → megacreditProduction, steel → steelProduction …
  PLAYER_FEATURES[name.replace(/s$/, '') + 'Production'] = (player) => player.production.get(resource);
}
for (const [name, tag] of Object.entries(TAGS)) {
  PLAYER_FEATURES[name] = (player) => player.tags.count(tag, 'raw');
}

/** Feature vector in the model's order, seen from `player` against `opponent`. */
export function bgaFeatures(player: IPlayer, opponent: IPlayer): Array<number> {
  const game = player.game;
  const own: Record<string, number> = {};
  const other: Record<string, number> = {};
  const ownPoints = player.getVictoryPoints();
  const otherPoints = opponent.getVictoryPoints();
  for (const [name, feature] of Object.entries(PLAYER_FEATURES)) {
    own[name] = feature(player, ownPoints);
    other[name] = feature(opponent, otherPoints);
  }
  const global: Record<string, number> = {
    generation: game.generation, temperature: game.getTemperature(), oxygen: game.getOxygenLevel(),
    oceans: game.board.getOceanSpaces().length, prelude: game.gameOptions.preludeExtension ? 1 : 0,
  };
  return MODEL.features.map((name) => {
    const [prefix, base] = name.includes('_') ? name.split('_') : ['', name];
    if (prefix === 'own') {
      return own[base];
    }
    if (prefix === 'opponent') {
      return other[base];
    }
    if (prefix === 'diff') {
      return own[base] - other[base];
    }
    return global[name];
  });
}

/** Raw model score for a feature vector: VP the final margin is expected to differ from the certain VP margin. */
export function bgaScore(features: ReadonlyArray<number>): number {
  return treeScore(MODEL.trees, features);
}

/** Expected final VP margin for a feature vector: certain VP margin plus the trees' estimate of what follows. */
export function bgaMargin(features: ReadonlyArray<number>): number {
  return MODEL.surePoints.reduce((sum, index) => sum + features[index], 0) + bgaScore(features);
}

/**
 * Expected final VP margin of `player` over the single opponent, made symmetric: the model sees each side once
 * (as own and as opponent), so swapping the players exactly flips the sign. Undefined outside two-player games.
 */
export function bgaExpectedMargin(player: IPlayer): number | undefined {
  const opponents = player.opponents;
  if (opponents.length !== 1) {
    return undefined;
  }
  const opponent = opponents[0];
  return (bgaMargin(bgaFeatures(player, opponent)) - bgaMargin(bgaFeatures(opponent, player))) / 2;
}
