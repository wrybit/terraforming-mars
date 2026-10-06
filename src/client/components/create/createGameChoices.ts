import {Expansion} from '@/common/cards/GameModule';
import {BoardName} from '@/common/boards/BoardName';
import {RandomBoardOption} from '@/common/boards/RandomBoardOption';
import {BoardNameType} from '@/common/game/NewGameConfig';
import {RandomMAOptionType} from '@/common/ma/RandomMAOptionType';

// Choices of the "Create game" form as data: the template renders them via v-for
// instead of writing out each tile individually.

// One option in the segmented control (SegmentedControl.vue)
export type SegmentOption = {
  value: string | number;
  label: string;
};

export type ExpansionChoice = {
  expansion: Expansion;
  label: string;
  iconClass: string;
  // Show the wiki link (RULEBOOK_URLS) as an info icon
  info?: boolean;
  // Still in development: small α after the name
  alpha?: boolean;
};

export const OFFICIAL_EXPANSIONS: ReadonlyArray<ExpansionChoice> = [
  {expansion: 'corpera', label: 'Corporate Era', iconClass: 'expansion-icon-CE'},
  {expansion: 'prelude', label: 'Prelude', iconClass: 'expansion-icon-prelude'},
  {expansion: 'prelude2', label: 'Prelude 2', iconClass: 'expansion-icon-prelude2'},
  {expansion: 'venus', label: 'Venus Next', iconClass: 'expansion-icon-venus'},
  {expansion: 'colonies', label: 'Colonies', iconClass: 'expansion-icon-colony'},
  {expansion: 'turmoil', label: 'Turmoil', iconClass: 'expansion-icon-turmoil'},
  {expansion: 'promo', label: 'Promos', iconClass: 'expansion-icon-promo', info: true},
];

export const FAN_EXPANSIONS: ReadonlyArray<ExpansionChoice> = [
  {expansion: 'ares', label: 'Ares', iconClass: 'expansion-icon-ares', info: true},
  {expansion: 'community', label: 'Community', iconClass: 'expansion-icon-community', info: true},
  {expansion: 'moon', label: 'The Moon', iconClass: 'expansion-icon-themoon', info: true},
  {expansion: 'pathfinders', label: 'Pathfinders', iconClass: 'expansion-icon-pathfinders', info: true},
  {expansion: 'ceo', label: 'CEOs', iconClass: 'expansion-icon-ceo', info: true},
  {expansion: 'starwars', label: 'Star Wars', iconClass: 'expansion-icon-starwars', info: true},
  {expansion: 'underworld', label: 'Underworld 2', iconClass: 'expansion-icon-underworld', info: true},
  {expansion: 'deltaProject', label: 'Delta Project', iconClass: 'expansion-icon-deltaProject', info: true, alpha: true},
];

export const OFFICIAL_BOARDS: ReadonlyArray<BoardNameType> = [
  BoardName.THARSIS,
  BoardName.HELLAS,
  BoardName.ELYSIUM,
];

export const FAN_BOARDS: ReadonlyArray<BoardNameType> = [
  BoardName.UTOPIA_PLANITIA,
  BoardName.VASTITAS_BOREALIS_NOVA,
  BoardName.TERRA_CIMMERIA_NOVA,
  BoardName.ARABIA_TERRA,
  BoardName.AMAZONIS,
  BoardName.TERRA_CIMMERIA,
  BoardName.VASTITAS_BOREALIS,
  BoardName.HOLLANDIA,
];

// "Random board" switch: drawn from the official boards or from all
export const RANDOM_BOARD_OPTIONS: ReadonlyArray<SegmentOption> = [
  {value: RandomBoardOption.OFFICIAL, label: 'Official'},
  {value: RandomBoardOption.ALL, label: 'All'},
];

export const PLAYER_COUNT_OPTIONS: ReadonlyArray<SegmentOption> = [
  {value: 1, label: 'Solo'},
  {value: 2, label: '2'},
  {value: 3, label: '3'},
  {value: 4, label: '4'},
  {value: 5, label: '5'},
  {value: 6, label: '6'},
];

export const MILESTONE_OPTIONS: ReadonlyArray<SegmentOption> = [
  {value: RandomMAOptionType.NONE, label: 'Board-defined'},
  {value: RandomMAOptionType.LIMITED, label: 'Random limited'},
  {value: RandomMAOptionType.UNLIMITED, label: 'Random full'},
];

export const AGENDA_OPTIONS: ReadonlyArray<SegmentOption> = [
  {value: 'Random', label: 'Random'},
  {value: 'Chairman', label: 'Chairman'},
];
