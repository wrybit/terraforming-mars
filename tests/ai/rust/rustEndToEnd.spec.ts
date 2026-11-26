// End-to-end test with the real Rust bot: every setup the create form allows with AI (form check with the bot's own
// support file) is created like the server does it and played with the bot until the game ends. A refused game, a
// decision the bot cannot give or an answer the game refuses fails the test.
//
// Needs a built bot with rust-ai-support.json next to it: RUST_BOT_BINARY=<bot> RUST_BOT_DATA=<data>
// RUST_E2E_SUPPORT=<rust-ai-support.json>. The lab repo's deployRustAi.py runs it before every deploy of the bot.
// Without them the suite is skipped.
import {expect} from 'chai';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {Game} from '../../../src/server/Game';
import {IGame} from '../../../src/server/IGame';
import {Player} from '../../../src/server/Player';
import {ApiCreateGame} from '../../../src/server/routes/ApiCreateGame';
import {startGame} from '../../../src/server/ai/rust/startRustGame';
import {RustMirror} from '../../../src/server/ai/rust/RustMirror';
import {RustBotProcess} from '../../../src/server/ai/rust/RustBotProcess';
import {RustFallbackLog} from '../../../src/server/ai/rust/rustFallbackLog';
import {rustOptionsText} from '../../../src/server/ai/rust/rustSetup';
import {randomResponse} from '../../../src/server/ai/randomResponse';
import {GameLoader} from '../../../src/server/database/GameLoader';
import {OrOptions} from '../../../src/server/inputs/OrOptions';
import {UndoActionOption} from '../../../src/server/inputs/UndoActionOption';
import {aiEngineFor, aiSettingsOf} from '../../../src/common/ai/aiCompatibility';
import {RUST_ONLY} from '../../../src/server/ai/aiEngineChoice';
import {AiSupport, EMPTY_AI_SUPPORT, parseAiSupport} from '../../../src/common/ai/aiSupportContract';
import {BoardName} from '../../../src/common/boards/BoardName';
import {Phase} from '../../../src/common/Phase';
import {NewGameConfig} from '../../../src/common/game/NewGameConfig';
import {isPlayerId, safeCast} from '../../../src/common/Types';
import {aiSetupCases} from './aiSetupCases';
import {cardModuleOf} from '../../../src/server/cards/cardModuleOf';

const BINARY = process.env.RUST_BOT_BINARY;
const DATA = process.env.RUST_BOT_DATA;
const SUPPORT = process.env.RUST_E2E_SUPPORT;
// Quick bot: the test checks that every decision works, not how good it is
const SETTINGS = {rollouts: 1, threads: 1, horizon: 0, candidates: 1, timeLimit: 5};
// Without any move for this long, a game is stuck
const STUCK_MILLISECONDS = 30_000;

function boardOf(name: string): BoardName {
  const board = Object.values(BoardName).find((candidate) => candidate.toLowerCase().replace(/ /g, '-') === name);
  if (board === undefined) {
    throw new Error(`unknown board in the support file: ${name}`);
  }
  return board;
}

let gameCount = 0;

/** Creates the game exactly like ApiCreateGame does (decision, Rust setup check, startGame). */
function create(config: NewGameConfig, board: BoardName): IGame {
  const options = ApiCreateGame.gameOptions(config, board);
  const mirror = rustOptionsText(options, config.players.length);
  if ('unsupported' in mirror) {
    throw new Error(`server refuses the AI: ${mirror.unsupported}`);
  }
  const players = config.players.map((seat, index) => {
    const player = new Player(seat.name, seat.color, false, 0, safeCast(`p-e2e-${index}`, isPlayerId));
    if (seat.aiLevel !== undefined) {
      player.aiLevel = seat.aiLevel;
      player.aiEngine = 'rust';
    }
    return player;
  });
  // Own id per game: the tests seed Math.random, a random id would repeat and mix the event files
  gameCount++;
  return startGame(players, () => Game.newInstance(`g-e2e-${gameCount}` as any, players, players[0], undefined as any, options, gameCount / 1000));
}

/**
 * Plays the game to its end like the server: the AI seats move through the real AI driver (aiDriver.ts, Rust bot,
 * stand-ins on failure), the human seats answer at random. Returns every problem; fallbacks are checked by the caller.
 */
async function playToEnd(game: IGame, untilGeneration = Infinity): Promise<Array<string>> {
  const problems: Array<string> = [];
  if (RustMirror.of(game) === undefined) {
    return ['no Rust mirror started'];
  }
  // The driver looks the game up before each move, like after a reload
  GameLoader.getInstance().add(game);
  let lastChange = Date.now();
  let lastState = '';
  while (game.phase !== Phase.END && game.generation <= untilGeneration) {
    // Like the AI driver: after a draft pick the offer to change it stays open; nobody answers it
    const drafting = game.phase === Phase.DRAFTING || game.phase === Phase.INITIALDRAFTING;
    const human = game.players.find((candidate) => {
      const waiting = candidate.getWaitingFor();
      return candidate.aiLevel === undefined && waiting !== undefined && !(drafting && waiting.optional === true);
    });
    if (human !== undefined) {
      const input = human.getWaitingFor()!;
      for (let attempt = 0; ; attempt++) {
        try {
          const response = randomResponse(input, human, Math.random);
          // Undo is a route of its own on the server (reload of an earlier save), never an answered input
          if (response.type === 'or' && input instanceof OrOptions && input.options[response.index] instanceof UndoActionOption) {
            continue;
          }
          human.process(response);
          break;
        } catch (error) {
          if (attempt > 50) {
            problems.push(`human seat cannot answer ${input.type}: ${(error as Error).message}`);
            return problems;
          }
        }
      }
      continue;
    }
    const state = `${game.lastSaveId}/${game.phase}/${game.generation}/${game.players.map((player) => player.getWaitingFor()?.type ?? '-').join(',')}`;
    if (state !== lastState) {
      lastState = state;
      lastChange = Date.now();
    } else if (Date.now() - lastChange > STUCK_MILLISECONDS) {
      problems.push(`game stuck for ${STUCK_MILLISECONDS / 1000} s in generation ${game.generation}, phase ${game.phase}: ${state}`);
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  RustMirror.of(game)?.close();
  return problems;
}

const describeWithBot = BINARY !== undefined && DATA !== undefined && SUPPORT !== undefined ? describe : describe.skip;
// The cases follow what the bot reports; read before mocha collects the tests
const support: AiSupport = SUPPORT === undefined ? EMPTY_AI_SUPPORT : parseAiSupport(JSON.parse(fs.readFileSync(SUPPORT, 'utf8'))).support;

describeWithBot('Rust AI end to end: every setup the form allows plays to the end', () => {
  let folder: string;
  let fallbacks: RustFallbackLog;
  const previous = {createBot: RustMirror.createBot, installed: RustMirror.installed, eventDirectory: RustMirror.eventDirectory, fallbackLog: RustMirror.fallbackLog};

  before(() => {
    folder = fs.mkdtempSync(path.join(os.tmpdir(), 'rust-e2e-'));
    fallbacks = new RustFallbackLog(path.join(folder, 'fallbacks.jsonl'));
    RustMirror.createBot = () => new RustBotProcess(BINARY!, DATA!, SETTINGS);
    RustMirror.installed = () => true;
    RustMirror.eventDirectory = folder;
    RustMirror.fallbackLog = fallbacks;
    // The AI driver waits the thinking time between moves when humans play; the test does not need the pause
    process.env.AI_EASY_THINKING_MS = '50';
  });

  after(() => {
    Object.assign(RustMirror, previous);
    // RUST_E2E_KEEP: event files stay for a look at a failing game
    if (process.env.RUST_E2E_KEEP === undefined) {
      fs.rmSync(folder, {recursive: true, force: true});
    } else {
      console.log('event files in', folder);
    }
  });

  for (const testCase of aiSetupCases(support)) {
    it(testCase.label, async () => {
      const boards = support.boards.length > 0 ? support.boards.map(boardOf) : [BoardName.THARSIS];
      const board = testCase.board ?? boards[0];
      const config = testCase.config;
      const formCheck = aiEngineFor(aiSettingsOf(config, board, cardModuleOf), {rust: support, typescript: EMPTY_AI_SUPPORT}, RUST_ONLY);
      if (formCheck.engine !== 'rust') {
        // The form does not offer the AI here: nothing the user could start
        expect(testCase.mustOfferAi, `form refuses the AI: ${formCheck.reasons.map((reason) => reason.kind + ' ' + reason.id).join(', ')}`).to.not.eq(true);
        return;
      }
      const game = create(config, board);
      const problems = await playToEnd(game, testCase.untilGeneration);
      const fallbacksOfGame = fallbacks.summary().recent.filter((entry) => entry.gameId === game.id).map((entry) => entry.decision + ': ' + entry.reason);
      if (testCase.knownIssue !== undefined) {
        // Still broken as known; the report names it so nobody takes the green run for "all fine"
        expect([...problems, ...fallbacksOfGame], `known issue fixed? remove its mark in aiSetupCases.ts: ${testCase.knownIssue}`).not.deep.eq([]);
        console.log(`KNOWN ISSUE (${testCase.label}): ${testCase.knownIssue}`);
        return;
      }
      expect(problems).deep.eq([]);
      expect(fallbacksOfGame).deep.eq([]);
    }).timeout(600_000);
  }
});
