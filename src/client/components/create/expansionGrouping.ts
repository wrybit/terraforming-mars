import {GameModule} from '@/common/cards/GameModule';
import {ExpansionChoice, FAN_EXPANSIONS, OFFICIAL_EXPANSIONS} from './createGameChoices';
import {ContentKey, TraitKey} from '@/common/game/expansionFacts';
import {expansionContents} from './expansionContents';

// Groupings of the expansion tiles on the "Create game" page: by source, by board, or "with / without" one
// kind of content. Single choice, remembered per browser.

/** Grouping choices, in menu order. */
export const EXPANSION_GROUPINGS = ['source', 'layout', 'newParameters', 'project', 'corporation', 'prelude', 'newTiles', 'award', 'milestone'] as const;
export type ExpansionGrouping = typeof EXPANSION_GROUPINGS[number];

/** Menu label per grouping (English, translated in the UI). */
export const GROUPING_LABELS: Readonly<Record<ExpansionGrouping, string>> = {
  source: 'Source',
  layout: 'Board',
  newParameters: 'Global parameters',
  project: 'Project cards',
  corporation: 'Corporations',
  prelude: 'Prelude cards',
  newTiles: 'New tiles',
  award: 'Awards',
  milestone: 'Milestones',
};

// "With / without" groupings: what they test and how their two groups are called
type PresenceGrouping = Exclude<ExpansionGrouping, 'source' | 'layout'>;
const PRESENCE: Readonly<Record<PresenceGrouping, {content?: ContentKey, trait?: TraitKey, with: string, without: string}>> = {
  newParameters: {trait: 'newParameters', with: 'With new global parameters', without: 'Without new global parameters'},
  project: {content: 'project', with: 'With project cards', without: 'Without project cards'},
  corporation: {content: 'corporation', with: 'With corporations', without: 'Without corporations'},
  prelude: {content: 'prelude', with: 'With preludes', without: 'Without preludes'},
  newTiles: {trait: 'newTiles', with: 'With new tiles', without: 'Without new tiles'},
  award: {content: 'award', with: 'With awards', without: 'Without awards'},
  milestone: {content: 'milestone', with: 'With milestones', without: 'Without milestones'},
};

/** One tile: an expansion, or the base game (no `choice`, always on). */
export type ExpansionTile = {
  module: GameModule;
  official: boolean;
  choice?: ExpansionChoice;
};

/** One group of tiles with its heading; `highlight` is the content the grouping is about. */
export type ExpansionGroup = {
  key: string;
  title: string;
  tiles: ReadonlyArray<ExpansionTile>;
  highlight?: ContentKey | TraitKey;
};

/** All tiles in their standard order: base game, official expansions, fan-made expansions. */
export const EXPANSION_TILES: ReadonlyArray<ExpansionTile> = [
  {module: 'base', official: true},
  ...OFFICIAL_EXPANSIONS.map((choice) => ({module: choice.expansion, official: true, choice})),
  ...FAN_EXPANSIONS.map((choice) => ({module: choice.expansion, official: false, choice})),
];

function has(tile: ExpansionTile, grouping: PresenceGrouping): boolean {
  const test = PRESENCE[grouping];
  const contents = expansionContents(tile.module);
  if (test.trait !== undefined) {
    return contents.traits.has(test.trait);
  }
  return test.content !== undefined && (contents.counts[test.content] ?? 0) > 0;
}

/** Groups of `grouping`, empty groups left out, tiles in standard order within each group. */
export function groupExpansions(grouping: ExpansionGrouping): Array<ExpansionGroup> {
  let groups: Array<ExpansionGroup>;
  if (grouping === 'source') {
    groups = [
      {key: 'official', title: 'Official', tiles: EXPANSION_TILES.filter((tile) => tile.official)},
      {key: 'fan', title: 'Fan-made', tiles: EXPANSION_TILES.filter((tile) => !tile.official)},
    ];
  } else if (grouping === 'layout') {
    groups = [
      {key: 'ownBoard', title: 'Own board', tiles: EXPANSION_TILES.filter((tile) => expansionContents(tile.module).layout === 'ownBoard'), highlight: 'ownBoard'},
      {key: 'changesMars', title: 'Changes Mars', tiles: EXPANSION_TILES.filter((tile) => expansionContents(tile.module).layout === 'changesMars'), highlight: 'newTiles'},
      {key: 'cardsOnly', title: 'Cards only', tiles: EXPANSION_TILES.filter((tile) => expansionContents(tile.module).layout === 'cardsOnly')},
    ];
  } else {
    const test = PRESENCE[grouping];
    groups = [
      {key: 'with', title: test.with, tiles: EXPANSION_TILES.filter((tile) => has(tile, grouping)), highlight: test.trait ?? test.content},
      {key: 'without', title: test.without, tiles: EXPANSION_TILES.filter((tile) => !has(tile, grouping))},
    ];
  }
  return groups.filter((group) => group.tiles.length > 0);
}

const STORAGE_KEY = 'tm_create_game_expansion_grouping';

/** Grouping last chosen in this browser, or `source`. */
export function loadExpansionGrouping(): ExpansionGrouping {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return EXPANSION_GROUPINGS.includes(value as ExpansionGrouping) ? value as ExpansionGrouping : 'source';
  } catch {
    // No storage (private window, opaque origin): start with the default
    return 'source';
  }
}

/** Remembers `grouping` for the next visit; silently does nothing without storage. */
export function saveExpansionGrouping(grouping: ExpansionGrouping): void {
  try {
    localStorage.setItem(STORAGE_KEY, grouping);
  } catch {
    // Grouping is a convenience: losing it is fine
  }
}
