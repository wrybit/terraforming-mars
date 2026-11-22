import {CardName} from '@/common/cards/CardName';
import {MILESTONE_COST} from '@/common/constants';
import {CardType} from '@/common/cards/CardType';
import {Tag} from '@/common/cards/Tag';
import {Color} from '@/common/Color';
import {TileType} from '@/common/TileType';
import {getCard} from '@/client/cards/ClientCardManifest';
import {ReplayPlayerState, ReplayState} from './reconstructReplay';

// What a player could do at a point of the replay, by the game's rules (Player.getActions on the server): which
// milestones they could claim, which cards they could pay for and meet the requirements of, what they could afford.
// The replay only knows the reconstructed state, so effects it doesn't track (Venus, colonies, special requirements)
// count as met – the menu rather shows an option too many than hides one the player had. Costs are only checked when
// the reconstructed money is reliable (replayMoneyReliable in replayActionMenu.ts).

export type ReplayMilestone = {name: string, threshold?: number};

const MAX_MILESTONES = 3;
const GREENERY_PLANTS = 8;
const ECOLINE_GREENERY_PLANTS = 7;
// Requirements of global parameters two steps wider (Adaptation Technology, Inventrix)
const REQUIREMENT_BONUS_CARDS: ReadonlyArray<CardName> = [CardName.ADAPTATION_TECHNOLOGY, CardName.INVENTRIX];
const REQUIREMENT_BONUS = 2;
const CITY_TILES = new Set<TileType>([TileType.CITY, TileType.CAPITAL]);
const GLOBAL_STEPS = {temperature: 2, oxygen: 1, oceans: 1};

// M€ a player can spend; Helion pays with heat too
export function replayMegacredits(player: ReplayPlayerState): number {
  return player.resources[0] + (player.played.includes(CardName.HELION) ? player.resources[5] : 0);
}

export function replayGreeneryPlants(player: ReplayPlayerState): number {
  return player.played.includes(CardName.ECOLINE) ? ECOLINE_GREENERY_PLANTS : GREENERY_PLANTS;
}

// Tags in play: events only count with their event tag, wild tags count for any tag
function tagsInPlay(player: ReplayPlayerState): Array<Tag> {
  return player.played.flatMap((name) => {
    const card = getCard(name);
    if (card === undefined) {
      return [];
    }
    return card.type === CardType.EVENT ? [Tag.EVENT] : [...card.tags];
  });
}

function tagCount(player: ReplayPlayerState, tags: ReadonlyArray<Tag>): number {
  const inPlay = tagsInPlay(player);
  return inPlay.filter((tag) => tags.includes(tag) || tag === Tag.WILD).length;
}

const ownTiles = (state: ReplayState, color: Color, types: ReadonlySet<TileType>) =>
  state.tiles.filter((tile) => tile.color === color && types.has(tile.tileType)).length;

// Score of a milestone like the server's getScore; undefined for milestones the replay can't judge
function milestoneScore(name: string, state: ReplayState, player: ReplayPlayerState, color: Color): number | undefined {
  const projects = player.played.map((card) => getCard(card)).filter((card) => card !== undefined);
  switch (name) {
  case 'Terraformer': return player.terraformRating;
  case 'Mayor': return ownTiles(state, color, CITY_TILES);
  case 'Gardener': return ownTiles(state, color, new Set([TileType.GREENERY]));
  case 'Builder': return tagCount(player, [Tag.BUILDING]);
  case 'Planner': return player.hand.length + player.unknownHand;
  case 'Generalist': return player.production.filter((value) => value > 0).length;
  case 'Specialist': return Math.max(...player.production);
  case 'Ecologist': return tagCount(player, [Tag.PLANT, Tag.ANIMAL, Tag.MICROBE]);
  case 'Tycoon': return projects.filter((card) => card.type === CardType.ACTIVE || card.type === CardType.AUTOMATED).length;
  case 'Legend': return projects.filter((card) => card.type === CardType.EVENT).length;
  case 'Diversifier': return new Set(tagsInPlay(player).filter((tag) => tag !== Tag.EVENT && tag !== Tag.WILD)).size +
    tagsInPlay(player).filter((tag) => tag === Tag.WILD).length;
  case 'Tactician': return projects.filter((card) => card.type !== CardType.EVENT && (card.requirements?.length ?? 0) > 0).length;
  case 'Energizer': return player.production[4];
  case 'Rim Settler': return tagCount(player, [Tag.JOVIAN]);
  default: return undefined;
  }
}

// Milestones the player could claim: at most three per game, 8 M€, and the target reached
export function replayClaimableMilestones(milestones: ReadonlyArray<ReplayMilestone>, state: ReplayState,
  player: ReplayPlayerState, color: Color, checkCosts = true): Array<string> {
  if (state.milestones.length >= MAX_MILESTONES || (checkCosts && replayMegacredits(player) < MILESTONE_COST)) {
    return [];
  }
  return milestones.filter((milestone) => {
    if (state.milestones.some((claimed) => claimed.name === milestone.name)) {
      return false;
    }
    const score = milestoneScore(milestone.name, state, player, color);
    return score === undefined || milestone.threshold === undefined || score >= milestone.threshold;
  }).map((milestone) => milestone.name);
}

// Global and tag requirements of a card; others (Venus, cities, production …) count as met
function meetsRequirements(name: CardName, state: ReplayState, player: ReplayPlayerState): boolean {
  const requirements = getCard(name)?.requirements ?? [];
  const bonus = player.played.some((card) => REQUIREMENT_BONUS_CARDS.includes(card)) ? 1 : 0;
  return requirements.every((requirement) => {
    const globals: Array<[number | undefined, number, number]> = [
      [requirement.temperature, state.temperature, GLOBAL_STEPS.temperature],
      [requirement.oxygen, state.oxygenLevel, GLOBAL_STEPS.oxygen],
      [requirement.oceans, state.oceans, GLOBAL_STEPS.oceans],
    ];
    for (const [target, current, step] of globals) {
      if (target !== undefined) {
        const slack = bonus * REQUIREMENT_BONUS * step;
        return requirement.max === true ? current <= target + slack : current >= target - slack;
      }
    }
    if (requirement.tag !== undefined) {
      const count = requirement.count ?? 1;
      const own = tagCount(player, [requirement.tag]);
      return requirement.max === true ? own <= count : own >= count;
    }
    return true;
  });
}

// Price after the discounts of the played cards, paid with M€, steel (building) and titanium (space)
function canPay(name: CardName, player: ReplayPlayerState): boolean {
  const card = getCard(name);
  if (card === undefined) {
    return true;
  }
  let cost = card.cost ?? 0;
  for (const played of player.played) {
    const discounts = getCard(played)?.cardDiscount;
    for (const discount of discounts === undefined ? [] : Array.isArray(discounts) ? discounts : [discounts]) {
      if (discount.tag === undefined) {
        cost -= discount.amount;
      } else if (card.tags.includes(discount.tag)) {
        cost -= discount.amount * (discount.per === 'tag' ? card.tags.filter((tag) => tag === discount.tag).length : 1);
      }
    }
  }
  const steelValue = 2 + (player.played.includes(CardName.ADVANCED_ALLOYS) ? 1 : 0);
  const titaniumValue = 3 + (player.played.includes(CardName.ADVANCED_ALLOYS) ? 1 : 0) + (player.played.includes(CardName.PHOBOLOG) ? 1 : 0);
  const budget = replayMegacredits(player) +
    (card.tags.includes(Tag.BUILDING) ? player.resources[1] * steelValue : 0) +
    (card.tags.includes(Tag.SPACE) ? player.resources[2] * titaniumValue : 0);
  return Math.max(0, cost) <= budget;
}

export function replayCardPlayable(name: CardName, state: ReplayState, player: ReplayPlayerState, checkCosts = true): boolean {
  return (!checkCosts || canPay(name, player)) && meetsRequirements(name, state, player);
}

// Standard projects cost M€ only
export function replayCanAffordProject(name: CardName, player: ReplayPlayerState, checkCosts = true): boolean {
  return !checkCosts || (getCard(name)?.cost ?? 0) <= replayMegacredits(player);
}
