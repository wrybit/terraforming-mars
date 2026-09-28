import {closeOtherOverlays} from '@/client/utils/overlayCoordinator';
import {PLAYER_CARDS_OVERLAY} from '@/client/components/overview/ownPlayerIndex';
import {range} from '@/common/utils/utils';

// Zugriff auf den Sichtbarkeitszustand der App (vueRoot), auf das Nötigste beschränkt
export type VisibilityStore = {
  getVisibilityState(key: string): boolean;
  setVisibilityState(key: string, value: boolean): void;
};

const pinnedKey = (playerIndex: number) => 'pinned_player_' + playerIndex;

export function isPlayerCardsPinned(store: VisibilityStore, playerIndex: number): boolean {
  return store.getVisibilityState(pinnedKey(playerIndex));
}

// Gespielte Karten eines Spielers umschalten: dieses Modal öffnen bzw. schließen, alle anderen Spieler immer schließen.
// Gemeinsam für die klassische Spielerleiste (PlayerInfo) und die Tabelle (PlayersTableRow).
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
