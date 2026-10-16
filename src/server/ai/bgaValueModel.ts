import {IPlayer} from '../IPlayer';
import {Tag} from '../../common/cards/Tag';
import {Resource} from '../../common/Resource';
import modelData from './data/bgaValueModel.json';

// Learned position value for two-player games: a gradient-boosted tree model (LightGBM) trained on about
// 43,000 two-player games from Board Game Arena predicts from a position who wins. Features are what both
// players have (resources, production, hand, cards in play, tags, VP by source) plus the global parameters;
// trees and feature order come from data/bgaValueModel.json (exported by the private test system).

type Tree = {f: Array<number>, t: Array<number>, l: Array<number>, r: Array<number>, v: Array<number>};
type ModelData = {features: Array<string>, pointsPerLogit: number, trees: Array<Tree>};
const MODEL = modelData as unknown as ModelData;

/** Final VP margin that one logit unit of the predicted win chance stands for (fitted on BGA games). */
export const POINTS_PER_LOGIT = MODEL.pointsPerLogit;

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

/** Raw model score (logit of the win chance) for a feature vector. */
export function bgaScore(features: ReadonlyArray<number>): number {
  let total = 0;
  for (const tree of MODEL.trees) {
    let node = 0;
    while (node >= 0) {
      node = features[tree.f[node]] <= tree.t[node] ? tree.l[node] : tree.r[node];
    }
    total += tree.v[-node - 1];
  }
  return total;
}

/**
 * Logit of `player`'s win chance against the single opponent, made symmetric: the model sees each side once
 * (as own and as opponent), so swapping the players exactly flips the sign. Undefined outside two-player games.
 */
export function bgaWinLogit(player: IPlayer): number | undefined {
  const opponents = player.opponents;
  if (opponents.length !== 1) {
    return undefined;
  }
  const opponent = opponents[0];
  return (bgaScore(bgaFeatures(player, opponent)) - bgaScore(bgaFeatures(opponent, player))) / 2;
}
