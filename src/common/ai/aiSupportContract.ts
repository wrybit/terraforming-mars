import {EXPANSIONS, Expansion} from '../cards/GameModule';
import {BoardName} from '../boards/BoardName';
import {KNOWN_DUNE_MODULE_IDS} from './aiDuneModules';

/**
 * Game options that change how the game plays, so the new AI has to know them.
 *
 * Keys of GameOptions. Options without influence on the AI (timers, undo, fast mode, real-time VP, public game,
 * analysis game, random first player …) are not listed: they never rule out the new AI.
 */
export const AI_OPTIONS = [
  'draftVariant',
  'initialDraftVariant',
  'preludeDraftVariant',
  'ceosDraftVariant',
  'twoCorpsVariant',
  'solarPhaseOption',
  'soloTR',
  'shuffleMapOption',
  'modularMA',
  'includeFanMA',
  'altVenusBoard',
  'requiresVenusTrackCompletion',
  'removeNegativeGlobalEventsOption',
  'requiresMoonTrackCompletion',
  'moonStandardProjectVariant',
  'moonStandardProjectVariant1',
  'aresExtremeVariant',
] as const;
export type AiOption = typeof AI_OPTIONS[number];

/**
 * What the new AI (Rust bot) can play: the contract of the file rust-ai-support.json next to the bot program.
 *
 * The file is built in the lab repository and shipped with every bot deploy, never edited in this repository.
 * Format: {"version": 1, "generated": ISO time, "botVersion": build id, "aiVersion": release name, "expansions": [...], "boards": [...],
 * "options": [...], "duneModules": [...], "botFeatures": [...]}. Everything listed is supported, everything else is not; the base game
 * always is. IDs are the code's IDs: expansion IDs (GameModule.ts), board names (BoardName.ts, also written as
 * slug, e.g. "arrakis-61"), GameOptions keys (AI_OPTIONS) and Dune module IDs.
 */
export type AiSupport = {
  version: number;
  generated: string | undefined;
  botVersion: string | undefined;
  /** Short release number of the bot shown to admins, e.g. "1.4" (one step up per release) */
  aiVersion?: string;
  expansions: ReadonlyArray<Expansion>;
  boards: ReadonlyArray<BoardName>;
  options: ReadonlyArray<AiOption>;
  duneModules: ReadonlyArray<string>;
  /** Start parameters the bot understands beyond the basic ones (BOT_FEATURES), e.g. randomness */
  botFeatures: ReadonlyArray<BotFeature>;
};

/** Support of a server without a (readable) file: the new AI plays nothing. */
export const EMPTY_AI_SUPPORT: AiSupport = {
  version: 1,
  generated: undefined,
  botVersion: undefined,
  expansions: [],
  boards: [],
  options: [],
  duneModules: [],
  botFeatures: [],
};

/** Start parameters a bot may announce: randomness = share of moves that are not the best (common/ai/rustBotStrength.ts). */
export const BOT_FEATURES = ['randomness'] as const;
export type BotFeature = typeof BOT_FEATURES[number];

/** Contract version this code reads. */
export const AI_SUPPORT_VERSION = 1;

/** File content with the IDs this code does not know, e.g. "boards: amazonis". */
export type ParsedAiSupport = {support: AiSupport, unknownIds: Array<string>};

/** Lowercase with dashes for spaces: "Arrakis 61" and "arrakis-61" name the same board. */
function slug(id: string): string {
  return id.trim().toLowerCase().replace(/\s+/g, '-');
}

const BOARDS_BY_SLUG = new Map<string, BoardName>(Object.values(BoardName).map((board) => [slug(board), board]));

function strings(value: unknown): Array<string> {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : [];
}

/**
 * Reads the file content; anything broken counts as unsupported.
 *
 * Unknown IDs are left out and reported in `unknownIds`; a missing list is an empty list; another contract
 * version or no object at all gives `EMPTY_AI_SUPPORT`.
 */
export function parseAiSupport(raw: unknown): ParsedAiSupport {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return {support: EMPTY_AI_SUPPORT, unknownIds: []};
  }
  const data = raw as Record<string, unknown>;
  if (data.version !== AI_SUPPORT_VERSION) {
    return {support: EMPTY_AI_SUPPORT, unknownIds: []};
  }
  const unknownIds: Array<string> = [];
  const known = <T extends string>(list: string, ids: Array<string>, find: (id: string) => T | undefined): Array<T> => {
    const result: Array<T> = [];
    for (const id of ids) {
      const found = find(id);
      if (found === undefined) {
        unknownIds.push(list + ': ' + id);
      } else if (!result.includes(found)) {
        result.push(found);
      }
    }
    return result;
  };
  const expansions = known('expansions', strings(data.expansions), (id) => EXPANSIONS.find((expansion) => expansion === id));
  const boards = known('boards', strings(data.boards), (id) => BOARDS_BY_SLUG.get(slug(id)));
  const options = known('options', strings(data.options), (id) => AI_OPTIONS.find((option) => option === id));
  // This branch may know no Dune modules at all: then the list is dropped without a report
  const duneModules = KNOWN_DUNE_MODULE_IDS === undefined ? [] :
    known('duneModules', strings(data.duneModules), (id) => KNOWN_DUNE_MODULE_IDS?.find((module) => module === id));
  return {
    support: {
      version: AI_SUPPORT_VERSION,
      generated: typeof data.generated === 'string' ? data.generated : undefined,
      botVersion: typeof data.botVersion === 'string' ? data.botVersion : undefined,
      // only set when the file names one (EMPTY_AI_SUPPORT has none)
      ...(typeof data.aiVersion === 'string' && data.aiVersion !== '' ? {aiVersion: data.aiVersion} : {}),
      expansions,
      boards,
      options,
      duneModules,
      botFeatures: known('botFeatures', strings(data.botFeatures), (id) => BOT_FEATURES.find((feature) => feature === id)),
    },
    unknownIds,
  };
}
