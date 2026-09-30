import {ViewModel, PublicPlayerModel} from '@/common/models/PlayerModel';
import {ActionLabel} from '@/client/components/overview/ActionLabel';
import {Phase} from '@/common/Phase';

// "Als Nächstes" erst ab drei Spielern: bei zweien ist klar, wer nach dem Aktiven dran ist
const SHOW_NEXT_LABEL_MIN = 2;

// Status eines Spielers für Spielerleiste, Spieler-Tabelle und Meilenstein-Tabelle – an einer Stelle,
// damit alle Ansichten denselben Stand zeigen
export function playerActionLabel(player: PublicPlayerModel, playerView: ViewModel): ActionLabel {
  const game = playerView.game;
  if (game.phase === Phase.DRAFTING) {
    return player.needsToDraft ? 'drafting' : 'none';
  }
  if (game.phase === Phase.RESEARCH) {
    return player.needsToResearch ? 'researching' : 'none';
  }
  if (game.phase === Phase.SOLAR) {
    // Berater der Weltregierung und Terra betreten die Solarphase kurz im Zug des aktiven Spielers.
    // Sonst ist es die Terraformung der Weltregierung: Der aktive Spieler ist dann veraltet,
    // wer entscheidet, zeigt die laufende Uhr (aus dem Original übernommen, #5187)
    const activePlayerIsDeciding = playerView.players.some((candidate) => candidate.isActive && candidate.timer.running);
    if (!activePlayerIsDeciding) {
      return player.timer.running ? 'active' : 'none';
    }
  }
  if (game.passedPlayers.includes(player.color)) {
    return 'passed';
  }
  if (player.isActive) {
    return 'active';
  }
  const notPassedPlayers = playerView.players.filter((candidate) => !game.passedPlayers.includes(candidate.color));
  const currentPlayerIndex = notPassedPlayers.findIndex((candidate) => candidate.color === player.color);
  if (currentPlayerIndex === -1) {
    return 'none';
  }
  const previousPlayerIndex = currentPlayerIndex === 0 ? notPassedPlayers.length - 1 : currentPlayerIndex - 1;
  if (notPassedPlayers[previousPlayerIndex].isActive && playerView.players.length > SHOW_NEXT_LABEL_MIN) {
    return 'next';
  }
  return 'none';
}
