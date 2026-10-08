import {IPlayer} from '../IPlayer';
import {PlayerInput} from '../PlayerInput';
import {GameLoader} from '../database/GameLoader';
import {chooseResponse} from './chooseResponse';
import {quickResponse} from './quickResponse';
import {randomResponse} from './randomResponse';
import {isSimulating} from './simulationSandbox';
import {registerAiHook} from './aiHook';
import {isActionMenu} from './gameCopy';

// Plays the moves of AI players on the server. Player.setWaitingFor reports every new input of
// an AI player; the move is made a little later so humans can follow the game.

// Follow-up questions (where to place a tile, how to pay) go fast; a new action waits longer so
// a human can see what the AI just did (1 s was too fast to follow in test games).
const MOVE_DELAY_MILLISECONDS = Number(process.env.AI_MOVE_DELAY_MS ?? 600);
const ACTION_DELAY_MILLISECONDS = Number(process.env.AI_ACTION_DELAY_MS ?? 2000);
const RANDOM_ATTEMPTS = 50;

function processWithFallback(player: IPlayer, input: PlayerInput): void {
  const level = player.aiLevel ?? 'normal';
  const attempts: Array<() => void> = [
    () => player.process(chooseResponse(input, player, level)),
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

async function makeMove(player: IPlayer, input: PlayerInput): Promise<void> {
  if (player.getWaitingFor() !== input) {
    return;
  }
  // After an undo or a reload the game lives on as a new object; this one is stale then.
  const current = await GameLoader.getInstance().getGame(player.game.id);
  if (current !== undefined && current !== player.game) {
    return;
  }
  if (player.getWaitingFor() !== input) {
    return;
  }
  processWithFallback(player, input);
}

function scheduleAiMove(player: IPlayer): void {
  if (isSimulating()) {
    return; // AI players inside game copies are moved by the lookahead, not here
  }
  const input = player.getWaitingFor();
  if (input === undefined) {
    return;
  }
  // The pause only lets humans follow the game; without humans the AI plays at full speed.
  const hasHuman = player.game.players.some((candidate) => candidate.aiLevel === undefined);
  const delay = !hasHuman ? 0 : isActionMenu(input) ? ACTION_DELAY_MILLISECONDS : MOVE_DELAY_MILLISECONDS;
  setTimeout(() => {
    makeMove(player, input).catch((error) => console.error('AI move failed', error));
  }, delay);
}

export function installAiDriver(): void {
  registerAiHook(scheduleAiMove);
}
