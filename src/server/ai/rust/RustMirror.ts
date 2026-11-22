// A game with Rust AI players keeps a copy of itself in a Rust bot process: the setup once, then every answered
// input of every player (humans included) with the random outcomes it caused. The events also go to a file per
// game, so a reloaded game (server restart, undo) can rebuild the copy: events up to the loaded save are replayed.
// Whenever the copy cannot follow, the game goes on with the TS AI for its Rust players.
import * as fs from 'fs';
import * as path from 'path';
import {IGame} from '../../IGame';
import {IPlayer} from '../../IPlayer';
import {PlayerInput} from '../../PlayerInput';
import {InputResponse} from '../../../common/inputs/InputResponse';
import {AiLevel} from '../../../common/ai/AiLevel';
import {RustBot, RustBotProcess, RustBotSettings} from './RustBotProcess';
import {RustFallbackLog, decisionLabel, rustFallbackLog} from './rustFallbackLog';
import {RandomRecord, recordRandom, takeRandom} from './rustRandom';
import {steps} from './rustSteps';
import {responseFor} from './rustContract';
import {RUST_BOT_BINARY, RUST_BOT_DATA, RUST_BOT_EVENTS} from './rustBotPaths';

const BINARY = RUST_BOT_BINARY;
const DATA = RUST_BOT_DATA;
const EVENT_DIRECTORY = RUST_BOT_EVENTS;

// Search effort per strength. The time limit keeps the bot about as quick as the TS AI on slow servers (AK1: 64
// rollouts took 9 s for one decision): the search stops there with fewer rollouts. A started rollout still ends and
// the first round over all candidates always runs, so a decision takes up to about twice the limit on AK1.
const SETTINGS: Record<AiLevel, RustBotSettings> = {
  easy: {rollouts: 4, threads: 1, horizon: 0, candidates: 4, timeLimit: 750},
  normal: {rollouts: 16, threads: 2, horizon: 0, candidates: 6, timeLimit: 1700},
  hard: {rollouts: 64, threads: 2, horizon: 0, candidates: 8, timeLimit: 2600},
};

type StoredEvent = {saveId: number, event: Record<string, unknown>};

// A bot that keeps dying while it is rebuilt will not recover in this game
const MAX_REBUILD_FAILURES = 3;

// Waiting time on top of the thinking time before the TypeScript AI makes the decision instead (admin setting)
const DEFAULT_EXTRA_WAIT_MILLISECONDS = 10_000;

/** How long a decision of the Rust AI may take: its thinking time plus the extra waiting time (read at every use). */
export function rustDecisionTimeout(level: AiLevel): number {
  const extra = Number(process.env.AI_RUST_EXTRA_WAIT_MS);
  return SETTINGS[level].timeLimit + (Number.isFinite(extra) && extra > 0 ? extra : DEFAULT_EXTRA_WAIT_MILLISECONDS);
}

/** True when this server has the Rust AI program. */
export function rustAiInstalled(): boolean {
  return BINARY !== undefined && DATA !== undefined && fs.existsSync(BINARY);
}


export class RustMirror {
  private static readonly mirrors = new Map<string, RustMirror>();
  /** for testing: the program behind the mirrors */
  public static createBot: (level: AiLevel) => RustBot = (level) => new RustBotProcess(BINARY ?? '', DATA ?? '', SETTINGS[level]);
  /** for testing */
  public static installed: () => boolean = rustAiInstalled;
  /** for testing */
  public static eventDirectory = EVENT_DIRECTORY;
  /** for testing */
  public static fallbackLog: RustFallbackLog = rustFallbackLog;

  private game: IGame;
  private random: RandomRecord;
  private readonly bots = new Map<AiLevel, RustBot>();
  // Requests run one after the other: events must reach the bot in game order
  private queue: Promise<unknown> = Promise.resolve();
  private broken: string | undefined = undefined;
  // Bots in a row that died while being rebuilt; at MAX_REBUILD_FAILURES the TypeScript AI plays the rest of the game
  private rebuildFailures = 0;
  private readonly events: Array<StoredEvent>;

  private constructor(game: IGame, private readonly setup: Record<string, unknown>, events: Array<StoredEvent>) {
    this.game = game;
    this.random = recordRandom(game.rng);
    this.events = events;
  }

  private static file(gameId: string): string {
    return path.join(RustMirror.eventDirectory, `${gameId}.jsonl`);
  }

  /** A new game with Rust players: keeps its setup (first line of the event file). */
  public static start(game: IGame, setup: Record<string, unknown>): void {
    fs.mkdirSync(RustMirror.eventDirectory, {recursive: true});
    fs.writeFileSync(RustMirror.file(game.id), JSON.stringify({setup}) + '\n');
    RustMirror.mirrors.set(game.id, new RustMirror(game, setup, []));
  }

  /** The mirror of a game object; undefined for an outdated object of a game that was loaded again. */
  public static of(game: IGame): RustMirror | undefined {
    const mirror = RustMirror.mirrors.get(game.id);
    return mirror?.game === game ? mirror : undefined;
  }

  /** A game object just loaded (server restart, undo, reload): its mirror follows it, rebuilt from the event file. */
  public static loaded(game: IGame): void {
    const mirror = RustMirror.mirrors.get(game.id);
    if (mirror === undefined) {
      const created = RustMirror.load(game);
      if (created !== undefined) {
        RustMirror.mirrors.set(game.id, created);
      }
    } else if (mirror.game !== game) {
      mirror.follow(game);
    }
  }

  private static load(game: IGame): RustMirror | undefined {
    let lines: Array<string>;
    try {
      lines = fs.readFileSync(RustMirror.file(game.id), 'utf8').split('\n').filter((line) => line !== '');
    } catch {
      return undefined;
    }
    const setup = JSON.parse(lines[0]).setup;
    const events = lines.slice(1).map((line) => JSON.parse(line) as StoredEvent);
    const mirror = new RustMirror(game, setup, events);
    mirror.follow(game);
    return mirror;
  }

  /** A reloaded game object: events after the loaded save are gone (undo), the bot copy starts over. */
  private follow(game: IGame): void {
    this.game = game;
    this.random = recordRandom(game.rng);
    const kept = this.events.filter((stored) => stored.saveId <= game.lastSaveId);
    this.events.splice(0, this.events.length, ...kept);
    try {
      fs.writeFileSync(RustMirror.file(game.id), [{setup: this.setup}, ...kept].map((line) => JSON.stringify(line)).join('\n') + '\n');
    } catch (error) {
      this.broken = `event file: ${(error as Error).message}`;
    }
    for (const bot of this.bots.values()) {
      bot.close();
    }
    this.bots.clear();
  }

  /** An answered input of any player: kept and passed on to the running bots. */
  public processed(player: IPlayer, input: PlayerInput, response: InputResponse, saveId: number): void {
    if (this.broken !== undefined) {
      return;
    }
    const event = {player: this.game.players.indexOf(player), steps: steps(input, response), ...takeRandom(this.random)};
    const stored = {saveId, event};
    this.events.push(stored);
    try {
      fs.appendFileSync(RustMirror.file(this.game.id), JSON.stringify(stored) + '\n');
    } catch (error) {
      this.broken = `event file: ${(error as Error).message}`;
      return;
    }
    for (const [level, bot] of this.bots) {
      // A bot that crashed or cannot follow an event is ended; the next decision starts a new one from the event
      // file (botFor), and a bot that keeps failing there gives the game to the TypeScript AI
      this.enqueue(() => bot.request({event})).catch(() => {
        if (this.bots.get(level) === bot) {
          bot.close();
          this.bots.delete(level);
        }
      });
    }
  }

  /**
   * The Rust bot's answer for `player`, or undefined when it cannot give one: the TypeScript AI makes this decision
   * then and the game goes on.
   *
   * A crashed bot or one without an answer in time (rustDecisionTimeout) is ended and started again for the next
   * decision, rebuilt from the event file; every such fallback is recorded (rustFallbackLog).
   */
  public async decide(player: IPlayer, input: PlayerInput, level: AiLevel): Promise<InputResponse | undefined> {
    if (this.broken !== undefined || !RustMirror.installed()) {
      return undefined;
    }
    const seat = this.game.players.indexOf(player);
    try {
      const bot = await this.botFor(level);
      const answer = await this.enqueue(() => bot.request({decide: {player: seat}}, rustDecisionTimeout(level)));
      return responseFor(input, answer.chain);
    } catch (error) {
      this.recordFallback(input, (error as Error).message);
      return undefined;
    }
  }

  /** Records a decision of this game the TypeScript AI makes instead of the Rust AI. */
  public recordFallback(input: PlayerInput, reason: string): void {
    RustMirror.fallbackLog.record({gameId: this.game.id, generation: this.game.generation, decision: decisionLabel(input), reason});
  }

  /** A bot per strength, started on first use with the setup and all events so far; after a crash a new one. */
  private async botFor(level: AiLevel): Promise<RustBot> {
    const running = this.bots.get(level);
    if (running?.alive) {
      return running;
    }
    running?.close();
    const bot = RustMirror.createBot(level);
    this.bots.set(level, bot);
    const events = this.events.map((stored) => stored.event);
    try {
      await this.enqueue(async () => {
        await bot.request({setup: this.setup});
        for (const event of events) {
          await bot.request({event});
        }
      });
    } catch (error) {
      bot.close();
      this.rebuildFailures++;
      if (this.rebuildFailures >= MAX_REBUILD_FAILURES) {
        this.giveUp(`cannot rebuild the game ${this.rebuildFailures} times: ${(error as Error).message}`);
      }
      throw error;
    }
    this.rebuildFailures = 0;
    return bot;
  }

  /** The game is over: the bots end, the event file stays (analysis of finished games). */
  public close(): void {
    for (const bot of this.bots.values()) {
      bot.close();
    }
    this.bots.clear();
    RustMirror.mirrors.delete(this.game.id);
  }

  private giveUp(reason: string): void {
    if (this.broken === undefined) {
      this.broken = reason;
      RustMirror.fallbackLog.record({gameId: this.game.id, generation: this.game.generation, decision: 'rest of the game', reason});
    }
    for (const bot of this.bots.values()) {
      bot.close();
    }
    this.bots.clear();
  }

  private enqueue<T>(work: () => Promise<T>): Promise<T> {
    const result = this.queue.then(work);
    // a failed request must not block the ones behind it
    this.queue = result.catch(() => undefined);
    return result;
  }
}
