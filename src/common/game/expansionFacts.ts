import {GameModule} from '../cards/GameModule';

// What the expansions add beyond their cards, for the "Create game" page (content line and grouping of the
// expansion tiles). Plain data on purpose: the client cannot read the server manifests, so
// tests/common/expansionFacts.spec.ts checks these numbers against them.

/** Countable content keys, in the order the content line lists equal counts. */
export const CONTENT_KEYS = ['project', 'corporation', 'prelude', 'ceo', 'globalEvent', 'colonyTile', 'standardProject', 'award', 'milestone'] as const;
export type ContentKey = typeof CONTENT_KEYS[number];

/** Traits without a count. */
export const TRAIT_KEYS = ['ownBoard', 'newParameters', 'changesMars', 'newTiles'] as const;
export type TraitKey = typeof TRAIT_KEYS[number];

/** Facts of one module that its card list does not show. */
export type ExpansionFacts = {
  globalEvent?: number;
  colonyTile?: number;
  milestone?: number;
  award?: number;
  traits?: ReadonlyArray<TraitKey>;
  // Kind of new tiles (English, translated in the UI); only set with the trait `newTiles`
  tiles?: string;
};

/** Facts per module; modules without entry add cards only. */
export const EXPANSION_FACTS: Readonly<Partial<Record<GameModule, ExpansionFacts>>> = {
  venus: {milestone: 2, award: 1, traits: ['ownBoard', 'newParameters']},
  colonies: {colonyTile: 11, milestone: 3, award: 1, traits: ['ownBoard', 'newTiles'], tiles: 'Colony tiles'},
  turmoil: {globalEvent: 36, milestone: 1, award: 2, traits: ['ownBoard']},
  community: {globalEvent: 1, colonyTile: 10, traits: ['newTiles'], tiles: 'Colony tiles'},
  ares: {milestone: 2, award: 2, traits: ['changesMars', 'newTiles'], tiles: 'Hazard tiles'},
  moon: {milestone: 2, award: 2, traits: ['ownBoard', 'newParameters', 'newTiles'], tiles: 'Moon tiles'},
  pathfinders: {globalEvent: 6, colonyTile: 1, milestone: 1, traits: ['ownBoard', 'newTiles'], tiles: 'Colony tiles'},
  underworld: {globalEvent: 5, milestone: 2, award: 2, traits: ['changesMars', 'newTiles'], tiles: 'Excavation tokens'},
  deltaProject: {traits: ['ownBoard']},
};
