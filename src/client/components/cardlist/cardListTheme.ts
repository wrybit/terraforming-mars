import {GameModule} from '@/common/cards/GameModule';
import {CardType} from '@/common/cards/CardType';
import {DUNE_EXPANSIONS, Theme, themeAllowsExpansion} from '@/common/theme/Theme';
import {ALL_DUNE_AWARDS, ALL_DUNE_MILESTONES, DUNE_ONLY_AWARDS, DUNE_ONLY_MILESTONES} from '@/common/dune/duneGoals';
import {CardListEntry, filterResource, filterTags} from '@/client/components/cardlist/cardListEntries';
import {ClientCard} from '@/common/cards/ClientCard';
import {MilestoneAwardKind} from '@/client/components/milestoneAwardChoice';
import {EXPANSION_OPTIONS, FilterOption, RESOURCE_OPTIONS, TAG_OPTIONS, TYPE_OPTIONS} from '@/client/components/cardlist/cardListOptions';
import {ResourceOption, TagOption, TypeOption} from '@/client/components/cardlist/CardListModel';

// What the card list shows per theme. Mars shows everything as before; Dune only what a Dune game can hold:
// the base game, the expansions the theme covers (Theme.ts DUNE_EXPANSIONS), the cards of the Dune expansion
// and the milestones and awards of Arrakis.

const DUNE_MODULES: ReadonlyArray<GameModule> = ['base', ...DUNE_EXPANSIONS, 'dune'];

// Kinds of entries that do not exist in a Dune game
const NOT_IN_DUNE: ReadonlyArray<TypeOption> = [CardType.CEO, 'colonyTiles', 'globalEvents', 'agendas'];

const DUNE_EXPANSION_OPTION: FilterOption<GameModule> = {key: 'dune', label: 'Dune expansion', iconClass: 'expansion-icon expansion-icon-dune'};

function inDune(entry: CardListEntry): boolean {
  if (NOT_IN_DUNE.includes(entry.type) || entry.module === undefined || !DUNE_MODULES.includes(entry.module)) {
    return false;
  }
  // Cards that need an expansion Dune leaves out (Venus, Colonies, Turmoil) are never dealt in a Dune game
  if (entry.card !== undefined && !entry.card.compatibility.every((expansion) => themeAllowsExpansion('dune', expansion))) {
    return false;
  }
  // Arrakis', the goals module's and the modules' milestones and awards (duneGoals.ts)
  if (entry.type === 'milestones') {
    return (ALL_DUNE_MILESTONES as ReadonlyArray<string>).includes(entry.name);
  }
  if (entry.type === 'awards') {
    return (ALL_DUNE_AWARDS as ReadonlyArray<string>).includes(entry.name);
  }
  return true;
}

// Milestones and awards made for Dune have no Mars name: never in the Mars card list
function inMars(entry: CardListEntry): boolean {
  if (entry.type === 'milestones') {
    return !(DUNE_ONLY_MILESTONES as ReadonlyArray<string>).includes(entry.name);
  }
  if (entry.type === 'awards') {
    return !(DUNE_ONLY_AWARDS as ReadonlyArray<string>).includes(entry.name);
  }
  return true;
}

/** Entries of the card list in `theme`; Mars keeps all of them. */
export function themeEntries(entries: ReadonlyArray<CardListEntry>, theme: Theme): ReadonlyArray<CardListEntry> {
  return theme === 'dune' ? entries.filter(inDune) : entries.filter(inMars);
}

/** Card types to filter by in `theme`. */
export function themeTypeOptions(theme: Theme): ReadonlyArray<FilterOption<TypeOption>> {
  return theme === 'dune' ? TYPE_OPTIONS.filter((option) => !NOT_IN_DUNE.includes(option.key)) : TYPE_OPTIONS;
}

/** Expansions to filter by in `theme`: Dune adds its own expansion, Mars has no switch for it. */
export function themeExpansionOptions(theme: Theme): ReadonlyArray<FilterOption<GameModule>> {
  return theme === 'dune' ? [...EXPANSION_OPTIONS.filter((option) => DUNE_MODULES.includes(option.key)), DUNE_EXPANSION_OPTION] : EXPANSION_OPTIONS;
}

// Options at least one entry of the Dune list carries; Mars keeps all options as before
function usedOptions<K extends string>(theme: Theme, options: ReadonlyArray<FilterOption<K>>, keys: (card: ClientCard) => ReadonlyArray<string>,
  entries: ReadonlyArray<CardListEntry>): ReadonlyArray<FilterOption<K>> {
  if (theme !== 'dune') {
    return options;
  }
  const used = new Set(entries.flatMap((entry) => entry.card === undefined ? [] : keys(entry.card)));
  return options.filter((option) => used.has(option.key));
}

/** Tags to filter by in `theme`: Dune leaves out the tags none of its cards carry (Moon, Mars, crime …). */
export function themeTagOptions(theme: Theme, entries: ReadonlyArray<CardListEntry>): ReadonlyArray<FilterOption<TagOption>> {
  return usedOptions(theme, TAG_OPTIONS, filterTags, entries);
}

/** Card resources to filter by in `theme`: Dune only those its cards hold. */
export function themeResourceOptions(theme: Theme, entries: ReadonlyArray<CardListEntry>): ReadonlyArray<FilterOption<ResourceOption>> {
  return usedOptions(theme, RESOURCE_OPTIONS, (card) => [filterResource(card)], entries);
}

/** Expansion filter a page in `theme` starts with: everything, the Dune expansion only in the Dune theme. */
export function defaultExpansions(theme: Theme, modules: ReadonlyArray<GameModule>): Record<GameModule, boolean> {
  return Object.fromEntries(modules.map((module) => [module, module !== 'dune' || theme === 'dune'])) as Record<GameModule, boolean>;
}

/** A rule of milestones or awards as a chip above the Dune goal cards: English text with its numbers. */
export type GoalRule = {text: string, params: Array<string>};

// The rules of the game (claim 8, fund 8/14/20, 5/2 points, at most 3) in the words of the mockup's goals page
export const DUNE_GOAL_RULES: Readonly<Record<MilestoneAwardKind, ReadonlyArray<GoalRule>>> = {
  milestones: [
    {text: 'Claim: ${0} Solari', params: ['8']},
    {text: '${0} victory points', params: ['5']},
    {text: 'At most ${0} per game', params: ['3']},
  ],
  awards: [
    {text: 'Fund: ${0} Solari', params: ['8 / 14 / 20']},
    {text: '1st place: ${0} victory points', params: ['5']},
    {text: '2nd place: ${0} victory points', params: ['2']},
    {text: 'At most ${0} per game', params: ['3']},
  ],
};

// Order of the goals as on the mockup's goals page (Naib, Planetologist, Landsraad Voice, Builder, Mentat …)
const DUNE_GOAL_ORDER: ReadonlyArray<string> = [
  'Mayor', 'Gardener', 'Terraformer', 'Builder', 'Planner',
  'Landlord', 'Banker', 'Scientist', 'Thermalist', 'Miner',
  // Goals module, as on the mockup page
  'Geologist', 'Energizer', 'T. Spacefarer', 'Spice Lord', 'Legend', 'Ecologist', 'Polar Explorer',
  'A. Zoologist', 'Desert Settler', 'Investor', 'Windtrap Magnate', 'Benefactor', 'Industrialist', 'Excentric',
  // One milestone per module
  'Bazaar Regular', 'Sandwalker', 'Sardaukar Commander', 'Schemer', 'CHOAM Partner', 'Smuggler King',
];

/** Goals in the order the theme shows them: Dune as on the mockup, Mars alphabetical as before. */
export function themeGoalOrder<T extends string>(names: ReadonlyArray<T>, theme: Theme): Array<T> {
  const sorted = names.toSorted();
  if (theme !== 'dune') {
    return sorted;
  }
  const rank = (name: string) => {
    const index = DUNE_GOAL_ORDER.indexOf(name);
    return index < 0 ? DUNE_GOAL_ORDER.length : index;
  };
  return sorted.sort((first, second) => rank(first) - rank(second));
}
