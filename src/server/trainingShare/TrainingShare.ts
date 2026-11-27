import {GameId} from '../../common/Types';
import {TRAINING_EXPORT_CONTRACT, TrainingShareResult, TrainingShareStatus} from '../../common/trainingShare/TrainingShareModel';
import {buildTrainingExport, BuiltTrainingExport, TrainingExportError, TrainingExportOptions} from './buildTrainingExport';
import {TrainingShareStore} from './TrainingShareStore';
import {decisionLogDirectory, trainingShareAnonymous, trainingShareMode, trainingShareUrl} from './trainingShareSettings';

/** Automatic uploads that failed are tried again at this interval, up to MAX_TRIES times */
const RETRY_INTERVAL_MS = 30 * 60 * 1000;
const MAX_TRIES = 5;
const UPLOAD_TIMEOUT_MS = 2 * 60 * 1000;
const PROBE_TIMEOUT_MS = 15 * 1000;

type Upload = (url: string, body: Buffer, key: string) => Promise<void>;
type Probe = (url: string) => Promise<void>;

/** Why fetch failed, e.g. ENOTFOUND or ECONNREFUSED: the admin sees whether name, firewall or time is the problem */
function failureReason(error: unknown): string {
  if (error instanceof Error && error.name === 'TimeoutError') {
    return `no answer within ${PROBE_TIMEOUT_MS / 1000} s`;
  }
  const cause = error instanceof Error ? (error.cause as {code?: string, message?: string} | undefined) : undefined;
  return cause?.code ?? cause?.message ?? (error instanceof Error ? error.message : String(error));
}

/**
 * Test of the connection without sending a game: GET on the receiver, which answers with its format and version.
 * Shows whether firewall, proxy or name resolution of this server let the uploads through.
 */
async function probeReceiver(url: string): Promise<void> {
  const host = new URL(url).host;
  let response: Response;
  try {
    response = await fetch(url, {method: 'GET', signal: AbortSignal.timeout(PROBE_TIMEOUT_MS)});
  } catch (error) {
    throw new Error(`${host} cannot be reached (${failureReason(error)}).`);
  }
  if (!response.ok) {
    throw new Error(`${host} answered HTTP ${response.status}.`);
  }
  let answer: {format?: unknown, version?: unknown};
  try {
    answer = await response.json();
  } catch {
    throw new Error(`${host} answers, but not as a receiver.`);
  }
  if (answer?.format !== TRAINING_EXPORT_CONTRACT.format) {
    throw new Error(`${host} answers, but not as a receiver.`);
  }
  if (answer.version !== TRAINING_EXPORT_CONTRACT.version) {
    throw new Error(`The receiver takes version ${String(answer.version)}, this server sends version ${TRAINING_EXPORT_CONTRACT.version}: update the game.`);
  }
}

/** POST of the packed game; the receiver answers 2xx when it stored the game, otherwise a text with the reason. */
async function postUpload(url: string, body: Buffer, key: string): Promise<void> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {'content-type': 'application/json', 'content-encoding': 'gzip', [TRAINING_EXPORT_CONTRACT.uploadHeader]: key},
    body: new Uint8Array(body),
    signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
  });
  if (!response.ok) {
    const reason = (await response.text()).slice(0, 300).trim();
    throw new Error(`The receiver ${new URL(url).host} refused the game (HTTP ${response.status}${reason === '' ? '' : ': ' + reason}).`);
  }
}

/**
 * Shares finished games with the AI training of this fork (admin settings, tab "Export"): automatically after
 * every finished game, or by the button in the games list. Nothing leaves the server while the setting is off.
 */
export class TrainingShare {
  private static instance: TrainingShare | undefined;
  private readonly running = new Set<string>();

  public constructor(
    private readonly store = new TrainingShareStore(),
    private readonly upload: Upload = postUpload,
    private readonly build: (gameId: GameId, options: TrainingExportOptions) => Promise<BuiltTrainingExport> = buildTrainingExport,
    private readonly serverVersion: string = 'unknown',
    private readonly probe: Probe = probeReceiver,
  ) {}

  public static getInstance(): TrainingShare {
    if (TrainingShare.instance === undefined) {
      TrainingShare.instance = new TrainingShare();
    }
    return TrainingShare.instance;
  }

  /** Server start: remember the running version and retry pending uploads now and then. */
  public static start(serverVersion: string): void {
    TrainingShare.instance = new TrainingShare(new TrainingShareStore(), postUpload, buildTrainingExport, serverVersion);
    setInterval(() => void TrainingShare.getInstance().retryPending(), RETRY_INTERVAL_MS).unref();
    void TrainingShare.getInstance().retryPending();
  }

  /** for tests */
  public static replaceInstance(share: TrainingShare | undefined): void {
    TrainingShare.instance = share;
  }

  public status(): TrainingShareStatus {
    // Read without creating a key: the key only comes into being with the first share
    const mode = trainingShareMode();
    const state = this.store.exists() ? this.store.read() : undefined;
    return {
      mode,
      anonymous: trainingShareAnonymous(),
      serverKeyStart: state?.serverKey.slice(0, 8),
      sharedGameIds: Object.keys(state?.shared ?? {}),
      pendingGameIds: Object.keys(state?.pending ?? {}),
      lastSharedAtMs: Math.max(0, ...Object.values(state?.shared ?? {})) || undefined,
      lastError: state?.lastError,
    };
  }

  /** Button "Test connection" in the Export tab: also while sharing is off, nothing of a game is sent. */
  public async testReceiver(): Promise<TrainingShareResult> {
    try {
      await this.probe(trainingShareUrl());
      return {ok: true};
    } catch (error) {
      return {ok: false, message: error instanceof Error ? error.message : String(error)};
    }
  }

  /** End of a game (GameLoader.completeGame): with "automatic" it goes out right away. */
  public onGameFinished(gameId: GameId, hasHuman: boolean): void {
    if (trainingShareMode() !== 'auto' || !hasHuman) {
      return;
    }
    this.store.update((state) => {
      if (state.shared[gameId] === undefined) {
        state.pending[gameId] = state.pending[gameId] ?? 0;
      }
    });
    void this.share(gameId);
  }

  public async retryPending(): Promise<void> {
    if (trainingShareMode() !== 'auto' || !this.store.exists()) {
      return;
    }
    for (const gameId of Object.keys(this.store.read().pending)) {
      await this.share(gameId as GameId);
    }
  }

  /** Packs and uploads one finished game; the answer says why not if it fails. */
  public async share(gameId: GameId): Promise<TrainingShareResult> {
    if (trainingShareMode() === 'off') {
      return {ok: false, message: 'Sharing is switched off (Admin → Settings → Export).'};
    }
    if (this.running.has(gameId)) {
      return {ok: false, message: `Game ${gameId} is being shared right now.`};
    }
    const state = this.store.read();
    if (state.shared[gameId] !== undefined) {
      return {ok: true};
    }
    this.running.add(gameId);
    try {
      const built = await this.build(gameId, {anonymous: trainingShareAnonymous(), secret: state.serverKey, decisionDirectory: decisionLogDirectory(), serverVersion: this.serverVersion});
      await this.upload(trainingShareUrl(), built.compressed, state.serverKey);
      this.store.update((next) => {
        next.shared[gameId] = Date.now();
        delete next.pending[gameId];
        if (next.lastError?.gameId === gameId) {
          next.lastError = undefined;
        }
      });
      return {ok: true};
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.store.update((next) => {
        next.lastError = {gameId, message, atMs: Date.now()};
        if (next.pending[gameId] !== undefined) {
          const tries = next.pending[gameId] + 1;
          // A game that cannot be packed (not finished, no human, too large) will not get better by trying again
          if (tries >= MAX_TRIES || error instanceof TrainingExportError) {
            delete next.pending[gameId];
          } else {
            next.pending[gameId] = tries;
          }
        }
      });
      return {ok: false, message};
    } finally {
      this.running.delete(gameId);
    }
  }
}
