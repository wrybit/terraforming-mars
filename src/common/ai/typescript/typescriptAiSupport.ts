import {BoardName} from '../../boards/BoardName';
import {AI_OPTIONS, AiSupport} from '../aiSupportContract';
import {KNOWN_DUNE_MODULE_IDS} from '../aiDuneModules';

// Part of the TypeScript AI: goes when that AI goes.

/** What the TypeScript AI plays: every board, option and Dune module except Merger, these expansions only. */
export const TYPESCRIPT_AI_SUPPORT: AiSupport = {
  version: 1,
  generated: undefined,
  botVersion: undefined,
  expansions: ['corpera', 'promo', 'venus', 'prelude', 'prelude2'],
  boards: Object.values(BoardName),
  // Merger: two corporations per player, the TypeScript AI only picks one
  options: AI_OPTIONS.filter((option) => option !== 'twoCorpsVariant'),
  duneModules: KNOWN_DUNE_MODULE_IDS ?? [],
  botFeatures: [],
};
