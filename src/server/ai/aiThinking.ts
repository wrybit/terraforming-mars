import {IPlayer} from '../IPlayer';
import {PlayerInput} from '../PlayerInput';
import {SelectCard} from '../inputs/SelectCard';
import {SelectInitialCards} from '../inputs/SelectInitialCards';
import {SelectProjectCardToPlay} from '../inputs/SelectProjectCardToPlay';
import {SelectSpace} from '../inputs/SelectSpace';
import {AI_THINKING_TEXTS, AiActivity, AiThinkingModel} from '../../common/ai/AiThinking';
import {Color} from '../../common/Color';

type Thinking = {color: Color, text: string, deadline: number};

// AI players that are deciding right now, per game (aiDriver.ts sets and clears them, GET /api/waitingfor reports
// them, the log shows a passing line with a countdown). Not saved: after a restart the next move sets it again.
const thinking = new Map<string, Map<string, Thinking>>();

function activityOf(input: PlayerInput): AiActivity {
  if (input instanceof SelectSpace) {
    return 'building';
  }
  if (input instanceof SelectCard || input instanceof SelectInitialCards || input instanceof SelectProjectCardToPlay) {
    return 'cards';
  }
  return 'thinking';
}

/** The AI seat decides on `input` for `durationMs` (the move comes when that time is up). */
export function startThinking(player: IPlayer, input: PlayerInput, durationMs: number): void {
  let players = thinking.get(player.game.id);
  if (players === undefined) {
    players = new Map();
    thinking.set(player.game.id, players);
  }
  const texts = AI_THINKING_TEXTS[activityOf(input)];
  const text = texts[Math.floor(Math.random() * texts.length)];
  players.set(player.id, {color: player.color, text, deadline: Date.now() + durationMs});
}

export function stopThinking(player: IPlayer): void {
  const players = thinking.get(player.game.id);
  players?.delete(player.id);
  if (players?.size === 0) {
    thinking.delete(player.game.id);
  }
}

/** The AI players of a game deciding right now (empty: none). */
export function thinkingIn(gameId: string): Array<AiThinkingModel> {
  const now = Date.now();
  return [...(thinking.get(gameId)?.values() ?? [])].map((entry) => ({
    color: entry.color,
    text: entry.text,
    remainingMs: Math.max(0, entry.deadline - now),
  }));
}
