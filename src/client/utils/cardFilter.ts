import {CardModel} from '@/common/models/CardModel';
import {CardName} from '@/common/cards/CardName';
import {CardType} from '@/common/cards/CardType';
import {Tag} from '@/common/cards/Tag';
import {CardResource} from '@/common/CardResource';
import {getCard} from '@/client/cards/ClientCardManifest';

/**
 * Filter of a card list (hand, play, sell, played cards).
 *
 * Within a group any chosen option matches (Jovian OR Science), the groups combine with AND
 * (Space AND at most 15 M€). An empty group doesn't filter.
 */
export type CardFilter = {
  types: Set<CardType>;
  tags: Set<Tag>;
  resources: Set<CardResource>;
  victoryPoints: boolean;
  // Highest cost still shown; undefined = no limit
  maxCost: number | undefined;
  // Only cards that can be played right now (hand only, see CardFilterContext)
  playableOnly: boolean;
};

/** What the list knows beyond the cards themselves. */
export type CardFilterContext = {
  // Cards that can be played right now; undefined where that doesn't apply (played cards, not your turn)
  playable?: ReadonlySet<CardName>;
  // Cost filter offered (not for played cards)
  withCost: boolean;
};

// Display order of the options: like the type sorting and the tag order of the player table
export const FILTER_TYPES: ReadonlyArray<CardType> = [
  CardType.CORPORATION, CardType.PRELUDE, CardType.CEO, CardType.ACTIVE, CardType.AUTOMATED, CardType.EVENT,
];
// The event tag is left out on purpose: it is identical to the card type "Event"
export const FILTER_TAGS: ReadonlyArray<Tag> = [
  Tag.BUILDING, Tag.SPACE, Tag.SCIENCE, Tag.POWER, Tag.EARTH, Tag.JOVIAN, Tag.VENUS, Tag.MOON, Tag.MARS,
  Tag.PLANT, Tag.MICROBE, Tag.ANIMAL, Tag.CITY, Tag.CRIME, Tag.CLONE, Tag.WILD,
];

export function emptyCardFilter(): CardFilter {
  return {types: new Set(), tags: new Set(), resources: new Set(), victoryPoints: false, maxCost: undefined, playableOnly: false};
}

/** Clears all groups in place (the filter object is shared reactive state). */
export function resetCardFilter(filter: CardFilter): void {
  filter.types.clear();
  filter.tags.clear();
  filter.resources.clear();
  filter.victoryPoints = false;
  filter.maxCost = undefined;
  filter.playableOnly = false;
}

// Changes go through these helpers: the filter is shared reactive state that components get as a prop
export function toggleVictoryPoints(filter: CardFilter): void {
  filter.victoryPoints = !filter.victoryPoints;
}

export function togglePlayableOnly(filter: CardFilter): void {
  filter.playableOnly = !filter.playableOnly;
}

export function setMaxCost(filter: CardFilter, maxCost: number | undefined): void {
  filter.maxCost = maxCost;
}

export function toggleInSet<T>(set: Set<T>, value: T): void {
  if (set.has(value)) {
    set.delete(value);
  } else {
    set.add(value);
  }
}

/** Cost as shown on the card (with discounts, if the server calculated them). */
export function cardCost(card: CardModel): number {
  return card.calculatedCost ?? getCard(card.name)?.cost ?? 0;
}

export function cardType(card: CardModel): CardType | undefined {
  return getCard(card.name)?.type;
}

/** Tags of the card without duplicates (Research counts once for Science) and without the event tag. */
export function cardTags(card: CardModel): ReadonlyArray<Tag> {
  const tags = getCard(card.name)?.tags ?? [];
  return [...new Set(tags)].filter((tag) => tag !== Tag.EVENT);
}

export function cardResource(card: CardModel): CardResource | undefined {
  return getCard(card.name)?.resourceType;
}

/** Fixed or variable victory points (1 VP per animal counts as well). */
export function hasVictoryPoints(card: CardModel): boolean {
  return getCard(card.name)?.victoryPoints !== undefined;
}

export function matchesCardFilter(card: CardModel, filter: CardFilter, context: CardFilterContext): boolean {
  if (filter.types.size > 0) {
    const type = cardType(card);
    if (type === undefined || !filter.types.has(type)) {
      return false;
    }
  }
  if (filter.tags.size > 0 && !cardTags(card).some((tag) => filter.tags.has(tag))) {
    return false;
  }
  if (filter.resources.size > 0) {
    const resource = cardResource(card);
    if (resource === undefined || !filter.resources.has(resource)) {
      return false;
    }
  }
  if (filter.victoryPoints && !hasVictoryPoints(card)) {
    return false;
  }
  if (context.withCost && filter.maxCost !== undefined && cardCost(card) > filter.maxCost) {
    return false;
  }
  if (filter.playableOnly && context.playable !== undefined && !context.playable.has(card.name)) {
    return false;
  }
  return true;
}

/** Number of active filter options – only those the list offers (no cost filter for played cards etc.). */
export function activeFilterCount(filter: CardFilter, context: CardFilterContext): number {
  return filter.types.size + filter.tags.size + filter.resources.size +
    (filter.victoryPoints ? 1 : 0) +
    (context.withCost && filter.maxCost !== undefined ? 1 : 0) +
    (filter.playableOnly && context.playable !== undefined ? 1 : 0);
}

export type FilterOptionCount<T> = {value: T, count: number};

/** Options of the filter menu with match counts – only what occurs in `cards`. */
export type CardFilterOptions = {
  // Only offered when there is more than one type
  types: Array<FilterOptionCount<CardType>>;
  tags: Array<FilterOptionCount<Tag>>;
  resources: Array<FilterOptionCount<CardResource>>;
  // Cards with victory points; undefined = none has any
  victoryPoints: number | undefined;
  // Playable cards; undefined = not offered
  playable: number | undefined;
  // Highest cost of the list (end of the cost slider); undefined = not offered
  highestCost: number | undefined;
};

function countBy<T>(cards: ReadonlyArray<CardModel>, order: ReadonlyArray<T>, valuesOf: (card: CardModel) => ReadonlyArray<T>): Array<FilterOptionCount<T>> {
  return order
    .map((value) => ({value, count: cards.filter((card) => valuesOf(card).includes(value)).length}))
    .filter((option) => option.count > 0);
}

export function cardFilterOptions(cards: ReadonlyArray<CardModel>, context: CardFilterContext): CardFilterOptions {
  const types = countBy(cards, FILTER_TYPES, (card) => {
    const type = cardType(card);
    return type === undefined ? [] : [type];
  });
  const resourceOrder = Object.values(CardResource);
  const withVictoryPoints = cards.filter(hasVictoryPoints).length;
  return {
    types: types.length > 1 ? types : [],
    tags: countBy(cards, FILTER_TAGS, cardTags),
    resources: countBy(cards, resourceOrder, (card) => {
      const resource = cardResource(card);
      return resource === undefined ? [] : [resource];
    }),
    victoryPoints: withVictoryPoints > 0 ? withVictoryPoints : undefined,
    playable: context.playable === undefined ? undefined : cards.filter((card) => context.playable?.has(card.name)).length,
    highestCost: context.withCost && cards.length > 0 ? Math.max(...cards.map(cardCost)) : undefined,
  };
}
