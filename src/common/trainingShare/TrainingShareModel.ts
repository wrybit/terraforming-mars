import contract from './trainingExportContract.json';

/**
 * Sharing finished games for the AI training (admin settings, tab "Export").
 * '' = off, 'manual' = a button per finished game, 'auto' = every finished game right after its end.
 */
export type TrainingShareMode = '' | 'manual' | 'auto';

export const TRAINING_SHARE_MODES: ReadonlyArray<TrainingShareMode> = ['', 'manual', 'auto'];

/** Receiver of the shared games: a container of its own on the public test server, next to the game. */
export const TRAINING_SHARE_DEFAULT_URL = 'https://terraforming-mars.baiz.org/api/training-upload';

/** File format and limits, shared with the receiver (it reads the same JSON file). */
export const TRAINING_EXPORT_CONTRACT = contract;

/** One exported game: every save, the decisions of AI and humans and the ratings of AI decisions. */
export type TrainingExport = {
  format: string,
  version: number,
  /** Pseudonym of the game id: the real ids are keys to the seats of the game and never leave the server */
  gameId: string,
  exportedAt: string,
  /** Player names, the game name, Discord ids and rating texts removed */
  anonymous: boolean,
  meta: TrainingExportMeta,
  saves: Array<{saveId: number, game: unknown}>,
  decisions: Array<unknown>,
  feedback: Array<unknown>,
};

export type TrainingExportMeta = {
  playerCount: number,
  humanCount: number,
  aiCount: number,
  players: Array<{name: string, color: string, aiLevel: string | null}>,
  generation: number,
  board: string,
  createdTimeMs: number,
  finishedTimeMs: number | undefined,
  saveCount: number,
  decisionCount: number,
  humanDecisionCount: number,
  feedbackCount: number,
  /** Analysis game: humans saw the AI's hand, so it is not comparable with normal games */
  aiAnalysis: boolean,
  aiVersion: string | undefined,
  serverVersion: string,
};

/** GET api/admin/training-share: what the Export tab and the games list show. */
export type TrainingShareStatus = {
  mode: TrainingShareMode,
  anonymous: boolean,
  /** First characters of this server's key: the receiver tells servers apart by it */
  serverKeyStart: string | undefined,
  sharedGameIds: Array<string>,
  pendingGameIds: Array<string>,
  lastSharedAtMs: number | undefined,
  lastError: {gameId: string, message: string, atMs: number} | undefined,
};

/** POST api/admin/training-share: share one finished game now. */
export type TrainingShareRequest = {gameId: string};

export type TrainingShareResult = {ok: true} | {ok: false, message: string};
