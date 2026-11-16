import {IPlayer} from '../IPlayer';
import {PlayerInput} from '../PlayerInput';
import {InputResponse} from '../../common/inputs/InputResponse';
import {GameLoader} from '../database/GameLoader';
import {chooseResponse} from './chooseResponse';
import {quickResponse} from './quickResponse';
import {randomResponse} from './randomResponse';
import {isSimulating} from './simulationSandbox';
import {registerAiHook} from './aiHook';
import {isActionMenu} from './gameCopy';
import {Phase} from '../../common/Phase';
import {takeAiDecisionSummary} from './decisionTrace';
import {runWithAiDecision} from '../logs/aiDecisionContext';
import {RustMirror} from './rust/RustMirror';
import {startThinking, stopThinking} from './aiThinking';
import {AiLevel} from '../../common/ai/AiLevel';

// Plays the moves of AI players on the server. Player.setWaitingFor reports every new input of
// an AI player; the move is made a little later so humans can follow the game.

// Follow-up questions (where to place a tile, how to pay) go fast; a new action waits longer so
// a human can see what the AI just did (1 s was too fast to follow in test games).
// Thinking time per decision when humans play along (Jens: hard 3 s, normal 2 s, easy 1 s). The AI decides
// within it and the move comes when it is up, so the log's countdown is right. Follow-up questions (where to
// place a tile, how to pay) are part of the same move and get at most AI_MOVE_DELAY_MS.
const ACTION_THINKING_MILLISECONDS = Number(process.env.AI_ACTION_DELAY_MS ?? 3000);
const MOVE_DELAY_MILLISECONDS = Number(process.env.AI_MOVE_DELAY_MS ?? 1000);
const LEVEL_SHARE: Record<AiLevel, number> = {easy: 1 / 3, normal: 2 / 3, hard: 1};
const RANDOM_ATTEMPTS = 50;

function processWithFallback(player: IPlayer, input: PlayerInput, chosen: InputResponse | undefined): void {
  const attempts: Array<() => void> = [
    ...(chosen !== undefined ? [() => player.process(chosen)] : []),
    () => player.process(quickResponse(input, player)),
  ];
  for (const attempt of attempts) {
    try {
      attempt();
      return;
    } catch (error) {
      if (player.getWaitingFor() !== input) {
        return; // the input was answered after all
      }
    }
  }
  for (let attempt = 0; attempt < RANDOM_ATTEMPTS; attempt++) {
    try {
      player.process(randomResponse(input, player, Math.random));
      return;
    } catch {
      // try another random answer
    }
  }
  console.warn(`AI player ${player.name} could not answer input ${input.type} in game ${player.game.id}`);
}

type Choice = {chosen: InputResponse | undefined, summary: ReturnType<typeof takeAiDecisionSummary>};

async function choose(player: IPlayer, input: PlayerInput): Promise<Choice> {
  // Rust AI players: the Rust bot's answer; without one (not installed, lost the game) the TS AI moves
  if (player.aiEngine === 'rust') {
    const answer = await RustMirror.of(player.game)?.decide(player, input, player.aiLevel ?? 'normal');
    if (answer !== undefined) {
      return {chosen: answer, summary: undefined};
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
  return {chosen, summary: takeAiDecisionSummary()};
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
      stopThinking(player);
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
  const {chosen, summary} = await choose(player, input);
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
    runWithAiDecision(player, summary, () => processWithFallback(player, input, chosen));
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
  const think = Math.round(ACTION_THINKING_MILLISECONDS * LEVEL_SHARE[player.aiLevel ?? 'normal']);
  const pause = !hasHuman ? 0 : isActionMenu(input) ? think : Math.min(think, MOVE_DELAY_MILLISECONDS);
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
