import {IPlayer} from '../IPlayer';
import {PlayerInput} from '../PlayerInput';
import {InputResponse} from '../../common/inputs/InputResponse';
import {GameLoader} from '../database/GameLoader';
import {chooseResponse} from './chooseResponse';
import {randomResponse} from './randomResponse';
import {isSimulating} from './simulationSandbox';
import {registerAiHook} from './aiHook';
import {isActionMenu} from './gameCopy';
import {Phase} from '../../common/Phase';
import {snapshot, takeAiDecisionSummary} from './decisionTrace';
import {rustDecisionSummary} from './rust/rustDecisionTrace';
import {runWithAiDecision} from '../logs/aiDecisionContext';
import {RustMirror} from './rust/RustMirror';
import {startThinking, stopThinking} from './aiThinking';
import {rustBotStrength} from '../../common/ai/rustBotStrength';
import {AiStandIn, aiStandIns} from './aiStandIns';
import {aiAdminSettings} from './aiEngineChoice';

// Plays the moves of AI players on the server. Player.setWaitingFor reports every new input of
// an AI player; the move is made a little later so humans can follow the game.

// Thinking time per move when humans play along: the admin's value per strength (AI tab, the same value the Rust AI
// searches for), read at every move so a change applies at once. The AI decides within it and the move comes when it
// is up, so the log's countdown is right. Follow-up questions (where to place a tile, how to pay) are part of the
// same move: they wait at most FOLLOW_UP_MILLISECONDS, enough to follow a placement.
const FOLLOW_UP_MILLISECONDS = 1000;
const RANDOM_ATTEMPTS = 50;

/** The AI's answer to one input and whether the Rust AI gave it. */
export type AiAnswer = {chosen: InputResponse | undefined, fromRust: boolean};

/**
 * Plays the first answer the game accepts: the chosen one; then the stand-ins in order (aiStandIns.ts: for a refused
 * Rust answer the TypeScript AI, recorded as a fallback; then a quick answer) and finally random answers, so the game
 * never stops.
 */
export function processWithFallback(player: Pick<IPlayer, 'process' | 'getWaitingFor' | 'name' | 'game'>, input: PlayerInput, answer: AiAnswer,
  standIns: ReadonlyArray<AiStandIn>, onRustRefused: (reason: string) => void): void {
  const {chosen, fromRust} = answer;
  if (chosen !== undefined) {
    try {
      player.process(chosen);
      return;
    } catch (error) {
      if (player.getWaitingFor() !== input) {
        return; // the input was answered after all
      }
      if (fromRust) {
        onRustRefused('the game refused its answer: ' + (error as Error).message);
      }
    }
  }
  for (const standIn of standIns) {
    try {
      const response = standIn.answer();
      if (response === undefined) {
        throw new Error(`no ${standIn.name} answer`);
      }
      player.process(response);
      return;
    } catch (error) {
      if (player.getWaitingFor() !== input) {
        return; // the input was answered after all
      }
    }
  }
  for (let attempt = 0; attempt < RANDOM_ATTEMPTS; attempt++) {
    try {
      player.process(randomResponse(input, player as IPlayer, Math.random));
      return;
    } catch {
      // try another random answer
    }
  }
  console.warn(`AI player ${player.name} could not answer input ${input.type} in game ${player.game.id}`);
}

type Choice = AiAnswer & {summary: ReturnType<typeof takeAiDecisionSummary>};

async function choose(player: IPlayer, input: PlayerInput): Promise<Choice> {
  // Rust AI players: the Rust bot's answer; without one (not installed, lost the game) the TS AI moves, unless the
  // admin turned the TypeScript stand-in off (then the stand-ins of aiStandIns.ts answer)
  if (player.aiEngine === 'rust') {
    // Analysis games: the bot also returns the options it weighed (values, trial games); otherwise only its move
    const analysisGame = player.game.gameOptions.aiAnalysis === true;
    const state = analysisGame ? snapshot(player) : undefined;
    const saveId = player.game.lastSaveId;
    const answer = await RustMirror.of(player.game)?.decideTraced(player, input, player.aiLevel ?? 'normal', analysisGame);
    if (answer !== undefined) {
      const summary = state === undefined ? undefined : rustDecisionSummary(player, input, answer.traces, state, saveId);
      return {chosen: answer.response, fromRust: true, summary};
    }
    if (!aiAdminSettings().typescriptFallback) {
      return {chosen: undefined, fromRust: false, summary: undefined};
    }
  }
  let chosen: InputResponse | undefined;
  try {
    chosen = chooseResponse(input, player, player.aiLevel ?? 'normal');
  } catch {
    chosen = undefined;
  }
  // Analysis game: the lines this move logs point to the decision (options and values). Taken right after the
  // decision: while a Rust bot thinks, other games' AI players decide too.
  return {chosen, fromRust: false, summary: takeAiDecisionSummary()};
}

function isCurrent(player: IPlayer, input: PlayerInput): boolean {
  return player.getWaitingFor() === input;
}

async function makeMove(player: IPlayer, input: PlayerInput, minimumMilliseconds: number): Promise<void> {
  try {
    await decideAndMove(player, input, minimumMilliseconds);
  } finally {
    // the log's "… is thinking" line goes; the move's own line follows
    if (player.getWaitingFor() !== input) {
      stopThinking(player, input);
    }
  }
}

async function decideAndMove(player: IPlayer, input: PlayerInput, minimumMilliseconds: number): Promise<void> {
  if (!isCurrent(player, input)) {
    return;
  }
  // After an undo or a reload the game lives on as a new object; this one is stale then.
  const current = await GameLoader.getInstance().getGame(player.game.id);
  if (current !== undefined && current !== player.game) {
    return;
  }
  if (!isCurrent(player, input)) {
    return;
  }
  // The thinking time counts towards the pause humans need to follow the game: before, the
  // rollouts (up to 4 s) came on top of the 2 s pause.
  const start = Date.now();
  const {chosen, fromRust, summary} = await choose(player, input);
  // the game may have moved on while the Rust bot was thinking (undo, reload)
  const after = await GameLoader.getInstance().getGame(player.game.id);
  if (!isCurrent(player, input) || (after !== undefined && after !== player.game)) {
    return;
  }
  const rest = minimumMilliseconds - (Date.now() - start);
  if (rest > 0) {
    await new Promise((resolve) => setTimeout(resolve, rest));
  }
  if (isCurrent(player, input)) {
    // A refused Rust answer: the stand-ins decide (the TypeScript AI first, if allowed) and the fallback is recorded.
    // Without a Rust answer the TypeScript AI already chose; it does not stand in for itself.
    const standIns = aiStandIns(player, input, aiAdminSettings()).filter((standIn) => fromRust || standIn.name !== 'typescript');
    const onRustRefused = (reason: string) => RustMirror.of(player.game)?.recordFallback(input, reason);
    runWithAiDecision(player, summary, () => processWithFallback(player, input, {chosen, fromRust}, standIns, onRustRefused));
  }
}

function scheduleAiMove(player: IPlayer): void {
  if (isSimulating()) {
    return; // AI players inside game copies are moved by the lookahead, not here
  }
  const input = player.getWaitingFor();
  if (input === undefined) {
    return;
  }
  // After its draft pick the AI is offered to change it while the others still choose. Answering
  // swapped the pick each time (the picked card is disabled in that offer), 253 times in one human
  // game, and the last swap kept the second-best card. The first pick stands.
  const drafting = player.game.phase === Phase.DRAFTING || player.game.phase === Phase.INITIALDRAFTING;
  if (drafting && input.optional === true) {
    return;
  }
  // The pause only lets humans follow the game; without humans the AI plays at full speed.
  const hasHuman = player.game.players.some((candidate) => candidate.aiLevel === undefined);
  const think = rustBotStrength(player.aiLevel ?? 'normal', process.env).timeLimit;
  const pause = !hasHuman ? 0 : isActionMenu(input) ? think : Math.min(think, FOLLOW_UP_MILLISECONDS);
  // Humans see that the AI is busy (game log, with countdown), not only after its move
  if (hasHuman) {
    startThinking(player, input, pause);
  }
  // Started on the next tick: the request that led here finishes first. The thinking fills the pause (makeMove).
  setTimeout(() => {
    makeMove(player, input, pause).catch((error) => console.error('AI move failed', error));
  }, 0);
}

export function installAiDriver(): void {
  registerAiHook(scheduleAiMove);
}
