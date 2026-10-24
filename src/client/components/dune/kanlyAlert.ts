import {reactive} from 'vue';
import {Color} from '@/common/Color';
import {KanlyModel} from '@/common/dune/DuneModel';
import {safeLocalStorage} from '@/client/utils/SafeLocalStorage';

// Kanly on the viewer's tile (Jens, 24 Oct 2026): the attacked player must not miss it. The first time they see the
// battle, the Kanly board tab opens by itself (GameBoardView.vue) and the war field tile flashes like a change on the
// planet (KanlyBattleCard.vue). Once per battle and device: the battle is remembered as seen in local storage.

/** A battle to flash: set when the tab opened because of it, cleared by the card once it flashed */
export const kanlyAlertState = reactive({
  pending: false,
});

/** One battle per generation, so game, generation and space name it */
export function kanlyAlertKey(game: string, generation: number, spaceId: string): string {
  return `kanly-alert:${game}:${generation}:${spaceId}`;
}

/** Whether the viewer is the one attacked: owner of the war field, not the one who opened the Kanly */
export function isAttacked(kanly: KanlyModel | undefined, viewer: Color | undefined): boolean {
  const battle = kanly?.battle;
  return viewer !== undefined && battle !== undefined && battle.owner === viewer && battle.opener !== viewer;
}

/** True only the first time for this battle on this device; marks it as seen */
export function claimKanlyAlert(key: string): boolean {
  if (safeLocalStorage.getItem(key) === '1') {
    return false;
  }
  safeLocalStorage.setItem(key, '1');
  return true;
}
