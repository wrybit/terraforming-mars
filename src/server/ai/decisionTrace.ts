import {IPlayer} from '../IPlayer';
import {PlayerInput} from '../PlayerInput';
import {isSimulating} from './simulationSandbox';
import {PlayerInputModel} from '../../common/models/PlayerInputModel';
import {InputResponse} from '../../common/inputs/InputResponse';
import {AiDecisionOption, AiDecisionState, AiDecisionSummary, MAX_SUMMARY_OPTIONS} from '../../common/ai/AiDecisionSummary';
import {AiLevel} from '../../common/ai/AiLevel';
import {IGame} from '../IGame';
import rawSettings from '../../genfiles/settings.json';
import {possibleActionsOf} from './possibleActions';

// Records what the AI could choose, how it valued every option and what it took. The game log
// only says what happened; to judge a decision one needs the alternatives and their values.
// Human inputs are recorded the same way (humanDecisionTrace.ts), so both can be used for training.
// Only active while a recorder is installed (AI test batches, server with AI_DECISION_LOG_DIR)
// or in analysis games, whose log shows every AI decision with its options.

export type DecisionKind = 'initial' | 'draft' | 'research' | 'keep' | 'action' | 'space' | 'human' | 'other';

export type TracedOption = {
  label: string,
  /** Value the AI gave the option, in M€ of position value (higher = better). */
  value?: number,
  /** Card timing: value when played now / when kept for later. */
  now?: number,
  later?: number,
  chosen?: boolean,
  note?: string,
  /** Position in the order the AI traced the options; stays the reference for ratings ("better would be"). */
  index?: number,
  /** Set when the option is a single card (analysis log shows its translated name). */
  card?: string,
  /** Initial selection: which part of the start the card belongs to. */
  group?: 'corporation' | 'prelude' | 'project',
};

export type PlayerSnapshot = {
  megaCredits: number, steel: number, titanium: number, plants: number, energy: number, heat: number,
  production: {megacredits: number, steel: number, titanium: number, plants: number, energy: number, heat: number},
  terraformRating: number, victoryPoints: number, hand: Array<string>, tableau: number,
  /** Names of all cards in front of the player (corporations included). */
  tableauCards: Array<string>,
  /** Cards drafted this generation but not yet bought. */
  draftedCards: Array<string>,
  /** Tag counts, only tags the player has. */
  tags: Record<string, number>,
};

export type DecisionRecord = {
  /** "<gameId>:<n>": the same id in this file, in the ratings (ai-feedback/<gameId>.jsonl) and on the log lines. */
  decisionId?: string,
  /** Player id of the decider: tells seats apart for good (names and colours may repeat across games). */
  playerId?: string,
  /** Strength of the deciding AI. */
  aiLevel?: AiLevel,
  /** Commit of the server code that decided. */
  serverVersion?: string,
  /** Game the decision belongs to, so records of parallel games can be told apart. */
  gameId: string,
  generation: number,
  phase: string,
  player: string,
  /** Player colour: tells players with the same name apart (several AIs are all called the same). */
  color?: string,
  kind: DecisionKind,
  title: string,
  state: PlayerSnapshot,
  globals: {temperature: number, oxygen: number, oceans: number},
  options: Array<TracedOption>,
  chosen: string,
  /** Extra numbers of the decision, e.g. budget and hand target when buying cards. */
  details?: Record<string, number | string>,
  milliseconds: number,
  /** Save the game had when the decision was asked; the full state is in that save. */
  saveId: number,
  /** Set for decisions of human players. */
  human?: boolean,
  /** The complete question as the client got it (offered cards, options, limits). */
  input?: PlayerInputModel,
  /** The raw answer of the player. */
  response?: InputResponse,
};

type OpenDecision = {kind?: DecisionKind, options: Array<TracedOption>, details?: Record<string, number | string>};

let recorder: ((record: DecisionRecord) => void) | undefined;
let open: OpenDecision | undefined;
// Summary of the last decision of an analysis game, picked up by the AI driver (takeAiDecisionSummary)
let lastSummary: AiDecisionSummary | undefined;
// Highest number handed out per game in this process: after an undo the game's counter goes back,
// the ids must not (they would point to two different decisions)
const issuedDecisionNumbers = new Map<string, number>();

/** Commit of the running server (build metadata); 'n/a' in development builds. */
export const SERVER_VERSION: string = rawSettings.head;

/** Globally unique, stable id "<gameId>:<running number>"; the number is saved with the game. */
export function nextDecisionId(game: IGame): string {
  const number = Math.max(game.aiDecisionCount, issuedDecisionNumbers.get(game.id) ?? 0) + 1;
  game.aiDecisionCount = number;
  issuedDecisionNumbers.set(game.id, number);
  return `${game.id}:${number}`;
}

/** The summary of the decision just made in an analysis game; cleared by reading. */
export function takeAiDecisionSummary(): AiDecisionSummary | undefined {
  const summary = lastSummary;
  lastSummary = undefined;
  return summary;
}

function summaryOption(option: TracedOption): AiDecisionOption {
  return {index: option.index, label: option.label, card: option.card, group: option.group, value: option.value, chosen: option.chosen};
}

/**
 * What the analysis log shows: the start selection with all its cards (grouped by the client),
 * otherwise the best options plus every chosen one. The decision log file keeps all of them.
 */
export function summaryOf(decisionId: string, kind: DecisionKind, title: string, options: ReadonlyArray<TracedOption>, saveId: number, generation: number, state?: PlayerSnapshot): AiDecisionSummary {
  let shown: Array<TracedOption>;
  if (kind === 'initial') {
    shown = options.filter((option) => option.card !== undefined);
  } else if (kind === 'action') {
    // All actions the AI tried: next to a pass they are what it could still have done
    shown = [...options].sort((a, b) => (b.value ?? -Infinity) - (a.value ?? -Infinity));
  } else {
    const ranked = [...options].sort((a, b) => (b.value ?? -Infinity) - (a.value ?? -Infinity));
    shown = ranked.filter((option, index) => index < MAX_SUMMARY_OPTIONS || option.chosen === true);
  }
  return {id: decisionId, kind, title, saveId, generation, options: shown.map(summaryOption), state: state === undefined ? undefined : stateOf(state)};
}

function stateOf(snapshot: PlayerSnapshot): AiDecisionState {
  return {
    megaCredits: snapshot.megaCredits, steel: snapshot.steel, titanium: snapshot.titanium,
    plants: snapshot.plants, energy: snapshot.energy, heat: snapshot.heat,
    production: {...snapshot.production},
    terraformRating: snapshot.terraformRating,
    victoryPoints: snapshot.victoryPoints,
    hand: [...snapshot.hand],
    tags: {...snapshot.tags},
  };
}

export function setDecisionRecorder(next: ((record: DecisionRecord) => void) | undefined): void {
  recorder = next;
}

/** True when decisions are written somewhere; lets callers skip building records. */
export function isRecordingDecisions(): boolean {
  return recorder !== undefined && !isSimulating();
}

/** Hands a finished record to the installed recorder (used for human decisions). */
export function emitDecision(record: DecisionRecord): void {
  recorder?.(record);
}

/** True while a top-level decision is being recorded (never inside game copies). */
export function isTracingDecision(): boolean {
  return open !== undefined && !isSimulating();
}

/** Called by the AI's choosers: the options they weighed. */
export function traceOptions(kind: DecisionKind, options: Array<TracedOption>, details?: Record<string, number | string>): void {
  if (!isTracingDecision() || open === undefined) {
    return;
  }
  open.kind = kind;
  // The traced order is the reference: ratings name a better option by this index
  open.options = options.map((option, index) => ({...option, index}));
  open.details = details;
}

export function titleText(input: PlayerInput): string {
  const title = input.title;
  return typeof title === 'string' ? title : title.message;
}

export function snapshot(player: IPlayer): PlayerSnapshot {
  const production = player.production.asUnits();
  return {
    megaCredits: player.megaCredits, steel: player.steel, titanium: player.titanium,
    plants: player.plants, energy: player.energy, heat: player.heat,
    production: {
      megacredits: production.megacredits, steel: production.steel, titanium: production.titanium,
      plants: production.plants, energy: production.energy, heat: production.heat,
    },
    terraformRating: player.terraformRating,
    victoryPoints: player.getVictoryPoints().total,
    hand: player.cardsInHand.map((card) => card.name),
    tableau: player.playedCards.length,
    tableauCards: Array.from(player.tableau, (card) => card.name),
    draftedCards: player.draftedCards.map((card) => card.name),
    tags: Object.fromEntries(Object.entries(player.tags.countAllTags()).filter(([, count]) => count > 0)),
  };
}

export function globalsOf(player: IPlayer): DecisionRecord['globals'] {
  const game = player.game;
  return {temperature: game.getTemperature(), oxygen: game.getOxygenLevel(), oceans: game.board.getOceanSpaces().length};
}

/** Wraps one top-level AI decision; `describe` turns the answer into a readable label. */
export function recordDecision<T>(input: PlayerInput, player: IPlayer, decide: () => T, describe: (response: T) => string): T {
  const analysisGame = player.game.gameOptions.aiAnalysis === true;
  if ((recorder === undefined && !analysisGame) || open !== undefined || isSimulating()) {
    return decide();
  }
  const start = performance.now();
  const state = snapshot(player);
  const game = player.game;
  const saveId = game.lastSaveId;
  const decision: OpenDecision = {options: []};
  open = decision;
  let response: T;
  try {
    response = decide();
  } finally {
    open = undefined;
  }
  const decisionId = nextDecisionId(game);
  const kind = decision.kind ?? 'other';
  const title = titleText(input);
  if (analysisGame) {
    lastSummary = summaryOf(decisionId, kind, title, decision.options, saveId, game.generation, state);
    if (lastSummary.state !== undefined && kind === 'action') {
      lastSummary.state.possibleActions = possibleActionsOf(input);
    }
  }
  recorder?.({
    decisionId,
    playerId: player.id,
    aiLevel: player.aiLevel,
    serverVersion: SERVER_VERSION,
    gameId: game.id,
    generation: game.generation,
    phase: game.phase,
    player: player.name,
    color: player.color,
    kind,
    title,
    state,
    globals: globalsOf(player),
    options: decision.options,
    chosen: describe(response),
    details: decision.details,
    milliseconds: Math.round(performance.now() - start),
    saveId,
  });
  return response;
}
