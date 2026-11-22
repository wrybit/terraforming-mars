import {Expansion} from '../cards/GameModule';
import {BoardName} from '../boards/BoardName';
import {NewGameConfig} from '../game/NewGameConfig';
import {RandomMAOptionType} from '../ma/RandomMAOptionType';
import {RUST_AI_OPTIONS, RustAiOption, RustAiSupport} from './RustAiSupport';

/** Settings of a new game the new AI has to play; options hold only those that take effect in this game. */
export type RustAiSettings = {
  expansions: Partial<Record<Expansion, boolean>>;
  /** Board of the game; undefined while not known yet (random board before the draw): never a reason. */
  boardName: BoardName | undefined;
  options: Partial<Record<RustAiOption, boolean>>;
  duneModules?: ReadonlyArray<string>;
};

/** One setting the new AI cannot play. */
export type RustAiBlocker =
  {kind: 'expansion', id: Expansion} |
  {kind: 'board', id: BoardName} |
  {kind: 'option', id: RustAiOption} |
  {kind: 'duneModule', id: string};

/** Result of the check; `reasons` is empty exactly when `ok`. */
export type RustAiCompatibility = {ok: boolean, reasons: Array<RustAiBlocker>};

/** Checks whether the new AI can play these settings. The same check runs in the create form and the server. */
export function isRustAiCompatible(settings: RustAiSettings, support: RustAiSupport): RustAiCompatibility {
  const reasons: Array<RustAiBlocker> = [];
  for (const [expansion, enabled] of Object.entries(settings.expansions) as Array<[Expansion, boolean | undefined]>) {
    if (enabled === true && !support.expansions.includes(expansion)) {
      reasons.push({kind: 'expansion', id: expansion});
    }
  }
  if (settings.boardName !== undefined && !support.boards.includes(settings.boardName)) {
    reasons.push({kind: 'board', id: settings.boardName});
  }
  for (const option of RUST_AI_OPTIONS) {
    if (settings.options[option] === true && !support.options.includes(option)) {
      reasons.push({kind: 'option', id: option});
    }
  }
  for (const module of settings.duneModules ?? []) {
    if (!support.duneModules.includes(module)) {
      reasons.push({kind: 'duneModule', id: module});
    }
  }
  return {ok: reasons.length === 0, reasons};
}

/**
 * Collects the settings of a create request that the new AI has to know.
 *
 * An option only counts where it takes effect, like the create form shows it: draft options with several players,
 * the 63 TR mode solo, expansion options with their expansion.
 */
export function rustAiSettingsOf(config: NewGameConfig, boardName: BoardName | undefined): RustAiSettings {
  const expansions = config.expansions;
  const several = config.players.length > 1;
  const randomGoals = several && config.randomMA !== RandomMAOptionType.NONE;
  const inEffect: Record<RustAiOption, boolean> = {
    draftVariant: several,
    initialDraftVariant: several,
    preludeDraftVariant: several && config.initialDraft === true && expansions.prelude === true,
    ceosDraftVariant: several && config.initialDraft === true && expansions.ceo === true,
    twoCorpsVariant: expansions.prelude === true,
    solarPhaseOption: true,
    soloTR: !several,
    shuffleMapOption: true,
    modularMA: randomGoals,
    includeFanMA: randomGoals,
    altVenusBoard: expansions.venus === true,
    requiresVenusTrackCompletion: several && expansions.venus === true,
    removeNegativeGlobalEventsOption: expansions.turmoil === true,
    requiresMoonTrackCompletion: expansions.moon === true,
    moonStandardProjectVariant: expansions.moon === true,
    moonStandardProjectVariant1: expansions.moon === true,
    aresExtremeVariant: expansions.ares === true,
  };
  const values: Record<RustAiOption, boolean | undefined> = {
    draftVariant: config.draftVariant,
    initialDraftVariant: config.initialDraft,
    preludeDraftVariant: config.preludeDraftVariant,
    ceosDraftVariant: config.ceosDraftVariant,
    twoCorpsVariant: config.twoCorpsVariant,
    solarPhaseOption: config.solarPhaseOption,
    soloTR: config.soloTR,
    shuffleMapOption: config.shuffleMapOption,
    modularMA: config.modularMA,
    includeFanMA: config.includeFanMA,
    altVenusBoard: config.altVenusBoard,
    requiresVenusTrackCompletion: config.requiresVenusTrackCompletion,
    removeNegativeGlobalEventsOption: config.removeNegativeGlobalEventsOption,
    requiresMoonTrackCompletion: config.requiresMoonTrackCompletion,
    moonStandardProjectVariant: config.moonStandardProjectVariant,
    moonStandardProjectVariant1: config.moonStandardProjectVariant1,
    aresExtremeVariant: config.aresExtremeVariant,
  };
  const options: Partial<Record<RustAiOption, boolean>> = {};
  for (const option of RUST_AI_OPTIONS) {
    options[option] = inEffect[option] && values[option] === true;
  }
  return {expansions, boardName, options};
}
