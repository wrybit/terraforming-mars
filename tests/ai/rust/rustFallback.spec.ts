import {expect} from 'chai';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {testGame} from '../../TestGame';
import {Game} from '../../../src/server/Game';
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

  it('gives the rest of the game to the TypeScript AI when the bot dies three times while being rebuilt', async () => {
    useFakeBot('dead');
    const {player, mirror} = mirrorOf();
    for (let decision = 0; decision < 4; decision++) {
      expect(await mirror.decide(player, new SelectOption('Pass'), 'easy')).is.undefined;
    }
    expect(started).has.length(3);
    expect(log.summary().recent.map((entry) => entry.decision)).contains('rest of the game');
    mirror.close();
  });

  it('keeps the events of the loaded save, not of the save loading itself wrote (undo)', () => {
    useFakeBot('dead');
    const {game, player, mirror} = mirrorOf();
    for (const saveId of [3, 4, 5]) {
      mirror.processed(player, new SelectOption('Pass'), {type: 'option'}, saveId);
    }
    // loading save 4 prompts the active player, which saves again (save 5) before the mirror hears of the new object
    const loaded = Game.deserialize(game.serialize());
    RustMirror.loaded(loaded, 4);
    const lines = fs.readFileSync(path.join(folder, `${game.id}.jsonl`), 'utf8').split('\n').filter((line) => line !== '');
    expect(lines.slice(1).map((line) => JSON.parse(line).saveId)).deep.eq([3, 4]);
    RustMirror.of(loaded)?.close();
  });

  it('keeps recording the game after giving it to the TypeScript AI, so a reload rebuilds it completely', async () => {
    useFakeBot('dead');
    const {game, player, mirror} = mirrorOf();
    for (let decision = 0; decision < 3; decision++) {
      await mirror.decide(player, new SelectOption('Pass'), 'easy');
    }
    mirror.processed(player, new SelectOption('Pass'), {type: 'option'}, game.lastSaveId);
    const lines = fs.readFileSync(path.join(folder, `${game.id}.jsonl`), 'utf8').split('\n').filter((line) => line !== '');
    expect(lines).has.length(2);
    mirror.close();
  });

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
