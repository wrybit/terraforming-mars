import {IPlayer} from '../IPlayer';
import {ICard, isIActionCard} from '../cards/ICard';
import {Tag} from '../../common/cards/Tag';
import {Resource} from '../../common/Resource';
import {CardName} from '../../common/cards/CardName';
import {Tree, treeScore} from './treeEnsemble';
import {tuningOf} from './aiTuning';
import draftModel from './data/bgaPolicyDraft.json';
import buyModel from './data/bgaPolicyBuy.json';
import playModel from './data/bgaPolicyPlay.json';

// Learned card choice (imitation of strong players): LightGBM models trained on about 54,000 two-player games
// from Board Game Arena (Tharsis, preludes, draft; both players Elo 600+) rank the offered cards the way those
// players picked them. The feature list is a contract with the private training script (trainBgaPolicy.py):
// position before the decision (own, opponent, difference) plus the card's own properties.

type PolicyModel = {features: Array<string>, cardIds: Record<string, number>, trees: Array<Tree>};
export type PolicyKind = 'draft' | 'buy' | 'play';
const MODELS: Record<PolicyKind, PolicyModel> = {
  draft: draftModel as unknown as PolicyModel,
  buy: buyModel as unknown as PolicyModel,
  // Which hand card strong players play next (candidates: hand cards they played sooner or later)
  play: playModel as unknown as PolicyModel,
};

const TRACKERS: Record<string, (player: IPlayer) => number> = {
  mc: (player) => player.megaCredits,
  st: (player) => player.steel,
  ti: (player) => player.titanium,
  pl: (player) => player.plants,
  en: (player) => player.energy,
  he: (player) => player.heat,
  pmc: (player) => player.production.get(Resource.MEGACREDITS),
  pst: (player) => player.production.get(Resource.STEEL),
  pti: (player) => player.production.get(Resource.TITANIUM),
  ppl: (player) => player.production.get(Resource.PLANTS),
  pen: (player) => player.production.get(Resource.ENERGY),
  phe: (player) => player.production.get(Resource.HEAT),
  hand: (player) => player.cardsInHand.length,
  area: (player) => player.tableau.length,
  events: (player) => player.getPlayedEventsCount(),
  tr: (player) => player.terraformRating,
  vp: (player) => player.getVictoryPoints().total,
  vpCards: (player) => player.getVictoryPoints().victoryPoints,
};
// BGA tracks these tags per player (tBuilding …)
const TRACKED_TAGS: Record<string, Tag> = {
  tBuilding: Tag.BUILDING, tSpace: Tag.SPACE, tScience: Tag.SCIENCE, tPower: Tag.POWER, tEarth: Tag.EARTH,
  tJovian: Tag.JOVIAN, tPlant: Tag.PLANT, tMicrobe: Tag.MICROBE, tAnimal: Tag.ANIMAL, tCity: Tag.CITY,
};
const CARD_TAGS = ['building', 'space', 'science', 'power', 'earth', 'jovian', 'plant', 'microbe', 'animal', 'city', 'wild', 'event', 'venus'];
const CARD_TYPES = ['automated', 'active', 'event', 'corporation', 'prelude'];

/** Position features (same for every offered card): globals, own/opponent/difference trackers, own tags. */
function positionFeatures(player: IPlayer): Record<string, number> {
  const game = player.game;
  const opponent = game.players.find((other) => other !== player) ?? player;
  const values: Record<string, number> = {
    gen: game.generation, temp: game.getTemperature(), oxy: game.getOxygenLevel(), oceans: game.board.getOceanSpaces().length,
    milestonesTaken: game.claimedMilestones.length, awardsFunded: game.fundedAwards.length,
  };
  for (const [name, read] of Object.entries(TRACKERS)) {
    const own = read(player);
    const other = read(opponent);
    values['own_' + name] = own;
    values['opp_' + name] = other;
    values['diff_' + name] = own - other;
  }
  for (const [name, tag] of Object.entries(TRACKED_TAGS)) {
    values['own_' + name] = player.tags.count(tag, 'raw');
  }
  return values;
}

/** The card's own features, as the card table of the training data describes it. */
function cardFeatures(card: ICard, player: IPlayer, position: Record<string, number>, ids: Record<string, number>, options: number): Record<string, number> {
  const tags: ReadonlyArray<string> = card.tags;
  const points = card.victoryPoints;
  const cost = card.cost ?? 0;
  const values: Record<string, number> = {
    cardId: ids[card.name] ?? -1,
    cost,
    vpFixed: typeof points === 'number' ? points : 0,
    vpSpecial: points !== undefined && typeof points !== 'number' ? 1 : 0,
    hasAction: isIActionCard(card) ? 1 : 0,
    requirements: card.requirements.length,
    hasResource: card.resourceType !== undefined ? 1 : 0,
    // Same fixed rates as the training data (BGA base values): steel 2 for buildings, titanium 3 for space
    affordGap: player.megaCredits + (tags.includes('building') ? 2 * player.steel : 0) + (tags.includes('space') ? 3 * player.titanium : 0) - cost,
    options,
    ownTagsMatch: tags.reduce((sum, tag) => {
      const tracked = Object.entries(TRACKED_TAGS).find(([, value]) => value === tag);
      return sum + (tracked ? position['own_' + tracked[0]] : 0);
    }, 0),
  };
  for (const type of CARD_TYPES) {
    values['type_' + type] = card.type === type ? 1 : 0;
  }
  for (const tag of CARD_TAGS) {
    values['tag_' + tag] = tags.filter((own) => own === tag).length;
  }
  return values;
}

/**
 * Policy score of each offered card (higher = strong players pick it more often), centred on the mean of the
 * offer, so it can be added to the card values as a preference. Two-player games only (training data).
 */
export function policyPreferences(player: IPlayer, cards: ReadonlyArray<ICard>, kind: PolicyKind): Map<CardName, number> {
  const result = new Map<CardName, number>();
  if (player.game.players.length !== 2 || cards.length === 0) {
    return result;
  }
  const model = MODELS[kind];
  const position = positionFeatures(player);
  const scores = cards.map((card) => {
    const values = {...position, ...cardFeatures(card, player, position, model.cardIds, cards.length)};
    return treeScore(model.trees, model.features.map((name) => values[name] ?? 0));
  });
  const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  cards.forEach((card, index) => result.set(card.name, scores[index] - mean));
  return result;
}

/** Raw model score of a feature vector (contract test against the training export). */
export function policyScore(kind: PolicyKind, features: ReadonlyArray<number>): number {
  return treeScore(MODELS[kind].trees, features);
}

/**
 * Card values plus the learned preference of strong players (aiTuning.ts policyWeight: M€ per unit of the
 * centred model score). Off (weight 0) returns the values unchanged.
 */
export function withPolicyPreference(player: IPlayer, cards: ReadonlyArray<ICard>, valueOf: (name: CardName) => number, kind: PolicyKind): (name: CardName) => number {
  const weight = tuningOf(player).policyWeight;
  if (weight <= 0) {
    return valueOf;
  }
  const preferences = policyPreferences(player, cards, kind);
  return (name) => valueOf(name) + weight * (preferences.get(name) ?? 0);
}

/**
 * Play order of strong players: preference (M€ per unit, aiTuning.ts playPolicyWeight) for each hand card that
 * can be played now, centred on these cards, so only the order among card plays changes on average.
 */
export function playPreferences(player: IPlayer, playable: ReadonlySet<CardName>): Map<CardName, number> {
  const weight = tuningOf(player).playPolicyWeight;
  const cards = player.cardsInHand.filter((card) => playable.has(card.name));
  if (weight <= 0 || cards.length < 2) {
    return new Map();
  }
  const preferences = policyPreferences(player, cards, 'play');
  return new Map([...preferences].map(([name, preference]) => [name, weight * preference]));
}
