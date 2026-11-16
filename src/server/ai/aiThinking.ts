import {IPlayer} from '../IPlayer';
import {PlayerInput} from '../PlayerInput';
import {OrOptions} from '../inputs/OrOptions';
import {SelectCard} from '../inputs/SelectCard';
import {SelectInitialCards} from '../inputs/SelectInitialCards';
import {SelectProjectCardToPlay} from '../inputs/SelectProjectCardToPlay';
import {SelectSpace} from '../inputs/SelectSpace';
import {AiActivity, AiThinkingModel} from '../../common/ai/AiThinking';

// AI players that are deciding right now, per game (aiDriver.ts sets and clears them, GET /api/waitingfor reports
// them, the log shows a passing line). Not saved: after a restart the next move sets it again.
const thinking = new Map<string, Map<string, AiThinkingModel>>();
let actionMenus = 0;

function activityOf(input: PlayerInput): AiActivity {
  if (input instanceof SelectSpace) {
    return 'building';
  }
  if (input instanceof SelectCard || input instanceof SelectInitialCards || input instanceof SelectProjectCardToPlay) {
    return 'cards';
  }
  if (input instanceof OrOptions && typeof input.title === 'string' && input.title.startsWith('Take your')) {
    // two words for the same, so the line does not read the same move after move
    actionMenus++;
    return actionMenus % 2 === 0 ? 'thinking' : 'pondering';
  }
  return 'playing';
}

export function startThinking(player: IPlayer, input: PlayerInput): void {
  let players = thinking.get(player.game.id);
  if (players === undefined) {
    players = new Map();
    thinking.set(player.game.id, players);
  }
  players.set(player.id, {color: player.color, activity: activityOf(input)});
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
  return [...(thinking.get(gameId)?.values() ?? [])];
}
