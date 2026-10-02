import {CardType} from '@/common/cards/CardType';
import {Tag} from '@/common/cards/Tag';
import {GameModule} from '@/common/cards/GameModule';
import {ClientCard} from '@/common/cards/ClientCard';
import {getCards} from '@/client/cards/ClientCardManifest';
import {allGlobalEventNames, getGlobalEventOrThrow} from '@/client/turmoil/ClientGlobalEventManifest';
import {COMMUNITY_COLONY_NAMES, OFFICIAL_COLONY_NAMES, PATHFINDERS_COLONY_NAMES} from '@/common/colonies/AllColonies';
import {getColonyOrThrow} from '@/client/colonies/ClientColonyManifest';
import {milestoneNames} from '@/common/ma/MilestoneName';
import {awardNames} from '@/common/ma/AwardName';
import {getAward, getMilestone} from '@/client/MilestoneAwardManifest';
import {BONUS_IDS, POLICY_IDS} from '@/common/turmoil/Types';
import {CardListModel, ResourceOption, TagOption, TypeOption} from '@/client/components/cardlist/CardListModel';

// All entries of the card list (cards, global events, colonies, milestones, awards, agendas)
// in one shape. All go through the same filter check – so results and match counts on the filters agree.

// Kind for the search index (SearchIndex.store)
export type SearchKind = 'card' | 'globalEvent' | 'colony' | 'ma' | 'agenda';

export type CardListEntry = {
  name: string;
  searchKind: SearchKind;
  type: TypeOption;
  // undefined: applies regardless of expansions (agendas)
  module: GameModule | undefined;
  card?: ClientCard;
};

export type FilterGroup = 'types' | 'tags' | 'expansions' | 'resources';
export type FilterState = Pick<CardListModel, 'types' | 'tags' | 'expansions' | 'resources' | 'vps' | 'costMin' | 'costMax'>;

const LISTED_CARD_TYPES: ReadonlyArray<CardType> = [
  CardType.AUTOMATED, CardType.ACTIVE, CardType.EVENT, CardType.PRELUDE,
  CardType.CORPORATION, CardType.CEO, CardType.STANDARD_PROJECT,
];

export function buildEntries(): Array<CardListEntry> {
  const entries: Array<CardListEntry> = [];
  for (const card of getCards((card) => LISTED_CARD_TYPES.includes(card.type))) {
    entries.push({name: card.name, searchKind: 'card', type: card.type, module: card.module, card});
  }
  for (const name of allGlobalEventNames()) {
    entries.push({name, searchKind: 'globalEvent', type: 'globalEvents', module: getGlobalEventOrThrow(name).module});
  }
  for (const name of [...OFFICIAL_COLONY_NAMES, ...COMMUNITY_COLONY_NAMES, ...PATHFINDERS_COLONY_NAMES]) {
    entries.push({name, searchKind: 'colony', type: 'colonyTiles', module: getColonyOrThrow(name).module ?? 'base'});
  }
  for (const name of milestoneNames) {
    entries.push({name, searchKind: 'ma', type: 'milestones', module: getMilestone(name).requirements ?? 'base'});
  }
  for (const name of awardNames) {
    entries.push({name, searchKind: 'ma', type: 'awards', module: getAward(name).requirements ?? 'base'});
  }
  for (const id of [...POLICY_IDS, ...BONUS_IDS]) {
    entries.push({name: id, searchKind: 'agenda', type: 'agendas', module: undefined});
  }
  return entries;
}

// Tags to filter by; the event tag is already covered by the card type "Event"
export function filterTags(card: ClientCard): Array<TagOption> {
  const tags = card.tags.filter((tag) => tag !== Tag.EVENT);
  return tags.length === 0 ? ['none'] : tags;
}

export function filterResource(card: ClientCard): ResourceOption {
  return card.resourceType ?? 'none';
}

// Checks all filters except text; ignore leaves out one group (for its match counts)
export function passesFilters(entry: CardListEntry, state: FilterState, ignore?: FilterGroup): boolean {
  if (ignore !== 'types' && state.types[entry.type] !== true) {
    return false;
  }
  if (ignore !== 'expansions' && entry.module !== undefined && state.expansions[entry.module] !== true) {
    return false;
  }
  if (!isInCostRange(entry.card?.cost, state)) {
    return false;
  }
  const card = entry.card;
  if (card === undefined) {
    return true;
  }
  if (ignore !== 'tags' && !filterTags(card).some((tag) => state.tags[tag] === true)) {
    return false;
  }
  if (ignore !== 'resources' && state.resources[filterResource(card)] !== true) {
    return false;
  }
  if (state.vps === 1 && card.victoryPoints === undefined) {
    return false;
  }
  if (state.vps === 2 && card.victoryPoints !== undefined) {
    return false;
  }
  return true;
}

export function hasCostRange(state: FilterState): boolean {
  return state.costMin !== undefined || state.costMax !== undefined;
}

// If a price range is set, only what has a price within it remains. Corporations, preludes, colonies etc. have
// no price and then disappear – "Price 5–10" should show exactly the cards that cost 5 to 10 M€.
function isInCostRange(cost: number | undefined, state: FilterState): boolean {
  if (!hasCostRange(state)) {
    return true;
  }
  return cost !== undefined &&
    (state.costMin === undefined || cost >= state.costMin) &&
    (state.costMax === undefined || cost <= state.costMax);
}

// Highest card price: upper bound of the price slider
export function highestCost(entries: ReadonlyArray<CardListEntry>): number {
  return entries.reduce((highest, entry) => Math.max(highest, entry.card?.cost ?? 0), 0);
}

function optionsOf(entry: CardListEntry, group: FilterGroup): ReadonlyArray<string> {
  switch (group) {
  case 'types': return [entry.type];
  case 'expansions': return entry.module === undefined ? [] : [entry.module];
  case 'tags': return entry.card === undefined ? [] : filterTags(entry.card);
  case 'resources': return entry.card === undefined ? [] : [filterResource(entry.card)];
  }
}

// Match count per option of a group: all other filters apply, the group itself does not
export function countOptions(entries: ReadonlyArray<CardListEntry>, state: FilterState, group: FilterGroup): Map<string, number> {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    if (passesFilters(entry, state, group)) {
      optionsOf(entry, group).forEach((key) => counts.set(key, (counts.get(key) ?? 0) + 1));
    }
  }
  return counts;
}
