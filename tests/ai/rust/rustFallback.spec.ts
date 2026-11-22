import {expect} from 'chai';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {testGame} from '../../TestGame';
import {SelectOption} from '../../../src/server/inputs/SelectOption';
import {RustMirror, rustDecisionTimeout} from '../../../src/server/ai/rust/RustMirror';
import {RustBot, RustBotProcess} from '../../../src/server/ai/rust/RustBotProcess';
import {RustFallbackLog} from '../../../src/server/ai/rust/rustFallbackLog';
import {processWithFallback} from '../../../src/server/ai/aiDriver';
import {InputResponse} from '../../../src/common/inputs/InputResponse';
import {AiLevel} from '../../../src/common/ai/AiLevel';

const FAKE_BOT = path.resolve('tests', 'ai', 'rust', 'fakeBot', 'fakeRustBot.js');
const SETTINGS = {rollouts: 1, threads: 1, horizon: 0, candidates: 1, timeLimit: 50};

describe('Rust AI fallback', () => {
  let folder: string;
  let log: RustFallbackLog;
  let started: Array<RustBot>;
  let previous: {createBot: typeof RustMirror.createBot, installed: typeof RustMirror.installed, eventDirectory: string, fallbackLog: RustFallbackLog};
  let warn: typeof console.warn;
  let extraWait: string | undefined;

  function useFakeBot(mode: string) {
    RustMirror.createBot = () => {
      const bot = new RustBotProcess(FAKE_BOT, mode, SETTINGS);
      started.push(bot);
      return bot;
    };
  }

  function mirrorOf() {
    const [game, player] = testGame(2);
    RustMirror.start(game, {});
    return {game, player, mirror: RustMirror.of(game)!};
  }

  beforeEach(() => {
    folder = fs.mkdtempSync(path.join(os.tmpdir(), 'rust-fallback-'));
    log = new RustFallbackLog(path.join(folder, 'fallbacks.jsonl'));
    started = [];
    previous = {createBot: RustMirror.createBot, installed: RustMirror.installed, eventDirectory: RustMirror.eventDirectory, fallbackLog: RustMirror.fallbackLog};
    RustMirror.installed = () => true;
    RustMirror.eventDirectory = folder;
    RustMirror.fallbackLog = log;
    warn = console.warn;
    console.warn = () => {};
    extraWait = process.env.AI_RUST_EXTRA_WAIT_MS;
  });

  afterEach(() => {
    started.forEach((bot) => bot.close());
    Object.assign(RustMirror, previous);
    console.warn = warn;
    if (extraWait === undefined) {
      delete process.env.AI_RUST_EXTRA_WAIT_MS;
    } else {
      process.env.AI_RUST_EXTRA_WAIT_MS = extraWait;
    }
    fs.rmSync(folder, {recursive: true, force: true});
  });

  it('leaves a decision to the TypeScript AI when the bot crashes, and starts a new bot for the next one', async () => {
    useFakeBot('crash');
    const {game, player, mirror} = mirrorOf();
    const input = new SelectOption('Take your first action');
    expect(await mirror.decide(player, input, 'easy')).is.undefined;
    expect(await mirror.decide(player, input, 'easy')).is.undefined;
    expect(started).has.length(2);
    const summary = log.summary();
    expect(summary.last24h).eq(2);
    expect(summary.recent[0]).deep.include({gameId: game.id, generation: game.generation, decision: 'option: Take your first action'});
    expect(summary.recent[0].reason).contains('exited');
    mirror.close();
  });

  it('leaves a decision to the TypeScript AI when the bot does not answer within thinking time plus extra wait', async () => {
    process.env.AI_RUST_EXTRA_WAIT_MS = '100';
    expect(rustDecisionTimeout('easy' as AiLevel)).eq(750 + 100);
    useFakeBot('hang');
    const {player, mirror} = mirrorOf();
    const start = Date.now();
    expect(await mirror.decide(player, new SelectOption('Pass'), 'easy')).is.undefined;
    expect(Date.now() - start).is.below(3000);
    expect(log.summary().recent[0].reason).contains('did not answer within 850 ms');
    expect(started[0].alive).is.false;
    mirror.close();
  }).timeout(5000);

  it('plays the TypeScript AI\'s decision when the game refuses the Rust answer, and records it', () => {
    const input = new SelectOption('Pass');
    const processed: Array<InputResponse> = [];
    let waiting = true;
    const player = {
      name: 'Bot',
      game: {id: 'g1'},
      getWaitingFor: () => waiting ? input : undefined,
      process: (response: InputResponse) => {
        if ((response as {type: string}).type === 'bad') {
          throw new Error('not an option');
        }
        processed.push(response);
        waiting = false;
      },
    } as any;
    const reasons: Array<string> = [];
    const typescript = {type: 'option'} as InputResponse;
    processWithFallback(player, input, {chosen: {type: 'bad'} as unknown as InputResponse, fromRust: true}, () => typescript, (reason) => reasons.push(reason));
    expect(processed).deep.eq([typescript]);
    expect(reasons).deep.eq(['the game refused its answer: not an option']);
  });
});
