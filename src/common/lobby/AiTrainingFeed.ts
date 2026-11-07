import {AiLevel} from '../ai/AiLevel';

// Contract between the AI test batches (their coordinator answers AI_TRAINING_FEED_PATH) and the lobby of a game
// server (server/aiTraining): which batch games one computer plays right now and which it finished last.
// The lobby shows them so visitors see the AI train on this very server.

export const AI_TRAINING_FEED_PATH = '/api/lobby-feed';
/** How many finished games of its own computer a server keeps to watch afterwards */
export const AI_TRAINING_FINISHED_GAMES = 3;

/** Switched-on options of the batch game, e.g. {preludeExtension: true, boardName: 'hellas'} (Game.resolveOptions turns them into GameOptions) */
export type AiTrainingGameOptions = Record<string, boolean | string>;

type AiTrainingGameBase = {
  /** Game number inside its batch */
  index: number;
  playerCount: number;
  level: AiLevel;
  /** AI variant per seat when the batch compares variants */
  variants?: ReadonlyArray<string>;
  generation: number;
  /** Milliseconds the game has been running (finished: how long it took) */
  elapsedMs: number;
};

export type AiTrainingFeedGame = AiTrainingGameBase & {
  gameOptions: AiTrainingGameOptions;
  /** Share of the global parameters already raised, 0 … 1 */
  terraforming: number;
};

/** The settings of a finished game come from the game itself */
export type AiTrainingFinishedGame = AiTrainingGameBase & {
  /** Running number over all batches (as on the batch dashboard) */
  number: number;
  finishedAt: number;
  /** Serialized final game, relative to the feed address */
  gamePath: string;
};

export type AiTrainingFeed = {
  batch: {id: string, commit: string};
  live: ReadonlyArray<AiTrainingFeedGame>;
  /** Newest last, at most AI_TRAINING_FINISHED_GAMES */
  finished: ReadonlyArray<AiTrainingFinishedGame>;
};

/** What is being tested: the variants besides the baseline, or the baseline itself */
function trainingSubject(variants: ReadonlyArray<string> | undefined): string | undefined {
  const distinct = Array.from(new Set(variants ?? []));
  const tested = distinct.filter((variant) => variant !== 'baseline');
  const shown = tested.length > 0 ? tested : distinct;
  return shown.length > 0 ? shown.join(' / ') : undefined;
}

/**
 * Name of a batch game in the lobby: "AI-Training <commit> <tested variants> #221.516".
 * A proper name, the same in every language; running games have no number yet (it is given when they finish).
 */
export function aiTrainingTitle(commit: string, variants: ReadonlyArray<string> | undefined, number?: number): string {
  const parts = ['AI-Training', commit.slice(0, 7), trainingSubject(variants)];
  if (number !== undefined) {
    // Thousands separated by a dot as on the batch dashboard (221.516), independent of the server's locale data
    parts.push('#' + String(number).replace(/\B(?=(\d{3})+(?!\d))/g, '.'));
  }
  return parts.filter((part) => part !== undefined && part !== '').join(' ');
}
