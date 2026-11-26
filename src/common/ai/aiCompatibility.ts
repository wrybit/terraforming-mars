import {Expansion} from '../cards/GameModule';
import {BoardName} from '../boards/BoardName';
import {NewGameConfig} from '../game/NewGameConfig';
import {RandomMAOptionType} from '../ma/RandomMAOptionType';
import {AI_OPTIONS, AiOption, AiSupport} from './aiSupportContract';
import {AiCardListModules, AiSetupLimit, CardModuleLookup, aiCardListLimits, aiCardListModules, aiSetupLimitsOf} from './aiSetupLimits';

/** Settings of a new game the new AI has to play; options hold only those that take effect in this game. */
export type AiSettings = {
  expansions: Partial<Record<Expansion, boolean>>;
  /** Board of the game; undefined while not known yet (random board before the draw): never a reason. */
  boardName: BoardName | undefined;
  options: Partial<Record<AiOption, boolean>>;
  duneModules?: ReadonlyArray<string>;
  /** Card lists and other setups only the TypeScript AI could play (aiSetupLimits.ts); the Rust AI cannot */
  setup?: ReadonlyArray<AiSetupLimit>;
  /** Expansions of the cards in the card lists; a list with a card the AI does not know blocks it */
  cardLists?: AiCardListModules;
};

/** One setting the new AI cannot play. */
export type AiBlocker =
  {kind: 'expansion', id: Expansion} |
  {kind: 'board', id: BoardName} |
  {kind: 'option', id: AiOption} |
  {kind: 'duneModule', id: string} |
  {kind: 'setup', id: AiSetupLimit};

/** Result of the check; `reasons` is empty exactly when `ok`. */
export type AiCompatibility = {ok: boolean, reasons: Array<AiBlocker>};

/** Checks whether the new AI can play these settings. The same check runs in the create form and the server. */
export function isAiCompatible(settings: AiSettings, support: AiSupport): AiCompatibility {
  const reasons: Array<AiBlocker> = [];
  for (const [expansion, enabled] of Object.entries(settings.expansions) as Array<[Expansion, boolean | undefined]>) {
    if (enabled === true && !support.expansions.includes(expansion)) {
      reasons.push({kind: 'expansion', id: expansion});
    }
  }
  if (settings.boardName !== undefined && !support.boards.includes(settings.boardName)) {
    reasons.push({kind: 'board', id: settings.boardName});
  }
  for (const option of AI_OPTIONS) {
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
export function aiSettingsOf(config: NewGameConfig, boardName: BoardName | undefined, moduleOf: CardModuleLookup = () => undefined): AiSettings {
  return {
    expansions: config.expansions, boardName, options: aiOptionsInEffect(config),
    duneModules: config.theme === 'dune' ? config.duneModules ?? [] : [], setup: aiSetupLimitsOf(config),
    cardLists: aiCardListModules(config, moduleOf),
  };
}

/**
 * Die KI-relevanten Optionen, die in diesem Spiel wirklich gelten: ein Schalter zählt nur dort, wo er wirkt.
 * Der Server legt das Spiel mit genau diesen Werten an, damit Formular-Prüfung und Rust-Spiegelung nie auseinanderlaufen
 * (26.11.2026: ein ausgeblendeter, aber gesetzter CEO-Draft-Schalter blockierte jedes KI-Spiel).
 */
export function aiOptionsInEffect(config: NewGameConfig): Record<AiOption, boolean> {
  const expansions = config.expansions;
  const several = config.players.length > 1;
  const randomGoals = several && config.randomMA !== RandomMAOptionType.NONE;
  const inEffect: Record<AiOption, boolean> = {
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
  const values: Record<AiOption, boolean | undefined> = {
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
  const options = {} as Record<AiOption, boolean>;
  for (const option of AI_OPTIONS) {
    options[option] = inEffect[option] && values[option] === true;
  }
  return options;
}

/** AI program of the admin settings. */
export const AI_ENGINE_CHOICES = ['typescript', 'rust'] as const;
export type AiEngineChoice = typeof AI_ENGINE_CHOICES[number];

/** Admin settings that decide which AI plays (AI_ENGINE, AI_TYPESCRIPT_FALLBACK in the server's .env). */
export type AiAdminSettings = {
  engine: AiEngineChoice;
  /** True: settings the Rust AI cannot play get the TypeScript AI instead of no AI. Off unless set (AI_TYPESCRIPT_FALLBACK=true). */
  typescriptFallback: boolean;
};

/** Which AI plays a new game; `none` with the reasons when no AI can play these settings. */
export type AiEngineDecision = {engine: AiEngineChoice | 'none', reasons: Array<AiBlocker>};

/**
 * Decides which AI plays a game with these settings. The create form and the server use it alike; the server's
 * decision when creating the game is binding.
 *
 * `reasons` always names what the admin's AI cannot play: the create form shows exactly that AI's support, so the
 * warning names the settings without a robot. With the Rust AI and the stand-in, the reasons are logged.
 */
export function aiEngineFor(settings: AiSettings, supports: {rust: AiSupport, typescript: AiSupport}, admin: AiAdminSettings): AiEngineDecision {
  const typescript = isAiCompatible(settings, supports.typescript);
  if (admin.engine === 'typescript') {
    return typescript.ok ? {engine: 'typescript', reasons: []} : {engine: 'none', reasons: typescript.reasons};
  }
  const rust = rustCompatibility(settings, supports.rust);
  if (rust.ok) {
    return {engine: 'rust', reasons: []};
  }
  if (admin.typescriptFallback && typescript.ok) {
    return {engine: 'typescript', reasons: rust.reasons};
  }
  return {engine: 'none', reasons: rust.reasons};
}

/** The Rust AI's check: its support file plus the setups it cannot mirror at all (no TypeScript AI stands in). */
function rustCompatibility(settings: AiSettings, support: AiSupport): AiCompatibility {
  // Ohne Corporate Era spielt der Bot, sobald er es meldet; ältere Bots kennen das Flag nicht
  const setup = (settings.setup ?? []).filter((id) => id !== 'noCorporateEra' || !support.botFeatures.includes('noCorporateEra'));
  const cardLists = settings.cardLists === undefined ? [] : aiCardListLimits(settings.cardLists, support.expansions);
  const reasons = [...isAiCompatible(settings, support).reasons, ...[...setup, ...cardLists].map((id): AiBlocker => ({kind: 'setup', id}))];
  return {ok: reasons.length === 0, reasons};
}

/** What the admin's AI plays; the create form marks exactly these settings, never the stand-in's. */
export function adminAiSupport(supports: {rust: AiSupport, typescript: AiSupport}, admin: AiAdminSettings): AiSupport {
  return admin.engine === 'rust' ? supports.rust : supports.typescript;
}

/** Text of one reason for logs and error messages, e.g. "expansion venus". */
export function aiBlockerText(blocker: AiBlocker): string {
  return blocker.kind + ' ' + blocker.id;
}
