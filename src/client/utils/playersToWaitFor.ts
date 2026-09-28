import {PlayerViewModel, PublicPlayerModel} from '@/common/models/PlayerModel';
import {Phase} from '@/common/Phase';

// Mitspieler, auf die gerade gewartet wird (ohne einen selbst) – aus dem Spielstand abgeleitet
// wie die Status-Anzeige in PlayersOverview: Draft/Forschung laufen parallel, sonst ist genau einer am Zug.
export function playersToWaitFor(playerView: PlayerViewModel): Array<PublicPlayerModel> {
  const phase = playerView.game.phase;
  const others = playerView.players.filter((player) => player.color !== playerView.thisPlayer.color);
  if (phase === Phase.DRAFTING) {
    return others.filter((player) => player.needsToDraft === true);
  }
  if (phase === Phase.RESEARCH) {
    return others.filter((player) => player.needsToResearch === true);
  }
  return others.filter((player) => player.isActive);
}
