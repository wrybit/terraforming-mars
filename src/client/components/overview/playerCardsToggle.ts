import {closeOtherOverlays} from '@/client/utils/overlayCoordinator';
import {PLAYER_CARDS_OVERLAY} from '@/client/components/overview/ownPlayerIndex';
import {range} from '@/common/utils/utils';

// Access to the app's visibility state (vueRoot), limited to the bare minimum
export type VisibilityStore = {
  getVisibilityState(key: string): boolean;
  setVisibilityState(key: string, value: boolean): void;
};

const pinnedKey = (playerIndex: number) => 'pinned_player_' + playerIndex;

export function isPlayerCardsPinned(store: VisibilityStore, playerIndex: number): boolean {
  return store.getVisibilityState(pinnedKey(playerIndex));
}

// Toggle a player's played cards: open or close this modal, always close all other players.
// Shared by the classic player bar (PlayerInfo) and the table (PlayersTableRow).
export function togglePlayerCards(store: VisibilityStore, playerIndex: number, playerCount: number): void {
  const wasPinned = isPlayerCardsPinned(store, playerIndex);
  if (!wasPinned) {
    closeOtherOverlays(PLAYER_CARDS_OVERLAY);
  }
  for (const index of range(playerCount)) {
    store.setVisibilityState(pinnedKey(index), false);
  }
  if (!wasPinned) {
    store.setVisibilityState(pinnedKey(playerIndex), true);
  }
}
