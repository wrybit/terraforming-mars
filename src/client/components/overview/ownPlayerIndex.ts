import {ViewModel} from '@/common/models/PlayerModel';

// Index of the own player for the "show" card view (pinned_player_<index>).
// PlayersOverview lists the opponents as 0..n-2 and the own player last – hence n-1.
// Shared contract for PlayersOverview and TopBar, so both open the same card view.
// Overlay key of all players' card views (overlayCoordinator.ts): PlayerInfo opens, OtherPlayer closes
export const PLAYER_CARDS_OVERLAY = 'player-cards';

export function ownPlayerIndex(playerView: ViewModel): number {
  return playerView.players.length - 1;
}
