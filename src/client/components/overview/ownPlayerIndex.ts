import {ViewModel} from '@/common/models/PlayerModel';

// Index des eigenen Spielers für die "anzeigen"-Kartenansicht (pinned_player_<index>).
// PlayersOverview listet die Gegner mit 0..n-2 und den eigenen Spieler zuletzt – daher n-1.
// Gemeinsamer Vertrag für PlayersOverview und TopBar, damit beide dieselbe Kartenansicht öffnen.
export function ownPlayerIndex(playerView: ViewModel): number {
  return playerView.players.length - 1;
}
