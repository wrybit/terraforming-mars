export const EXPANSIONS = [
  'corpera',
  'promo',
  'venus',
  'colonies',
  'prelude',
  'prelude2',
  'turmoil',
  'community',
  'ares',
  'moon',
  'pathfinders',
  'ceo',
  'starwars',
  'underworld',
  'deltaProject',
] as const;

export const GAME_MODULES = [
  'base',
  ...EXPANSIONS,
  // Cards of the Dune expansion (common/dune/DuneModule.ts): switched on by its modules, not as an expansion
  'dune',
] as const;
export type GameModule = typeof GAME_MODULES[number];

export type Expansion = typeof EXPANSIONS[number];

export const MODULE_NAMES = {
  base: 'Base',
  corpera: 'Corporate Era',
  promo: 'Promo',
  venus: 'Venus Next',
  colonies: 'Colonies',
  prelude: 'Prelude',
  prelude2: 'Prelude 2',
  turmoil: 'Turmoil',
  community: 'Community',
  ares: 'Ares',
  moon: 'The Moon',
  pathfinders: 'Pathfinders',
  ceo: 'CEOs',
  starwars: 'Star Wars',
  underworld: 'Underworld',
  deltaProject: 'Delta Project',
  dune: 'Dune expansion',
} satisfies Record<GameModule, string>;

export const DEFAULT_EXPANSIONS = {
  corpera: true,
  promo: false,
  venus: false,
  colonies: false,
  prelude: false,
  prelude2: false,
  turmoil: false,
  community: false,
  ares: false,
  moon: false,
  pathfinders: false,
  ceo: false,
  starwars: false,
  underworld: false,
  deltaProject: false,
} satisfies Record<Expansion, boolean>;
