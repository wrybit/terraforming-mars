import {PublicPlayerModel, ViewModel} from '@/common/models/PlayerModel';
import {Phase} from '@/common/Phase';

// Other players currently being waited for (excluding oneself; spectators have no thisPlayer) – derived from the game state
// like the status display in PlayersOverview: draft/research run in parallel, otherwise exactly one is taking their turn.
export function playersToWaitFor(playerView: ViewModel): Array<PublicPlayerModel> {
  const phase = playerView.game.phase;
  const others = playerView.players.filter((player) => player.color !== playerView.thisPlayer?.color);
  if (phase === Phase.DRAFTING) {
    return others.filter((player) => player.needsToDraft === true);
  }
  if (phase === Phase.RESEARCH) {
    return others.filter((player) => player.needsToResearch === true);
  }
  return others.filter((player) => player.isActive);
}
