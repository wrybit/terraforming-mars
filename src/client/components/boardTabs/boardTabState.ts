// Which board tab (Mars, Moon, Colonies …) is open above the right column. Shared state, because
// inputs switch the board by themselves: placing a moon tile opens the Moon, trading opens the Colonies.
import {nextTick, reactive} from 'vue';
import {BoardTabId} from './boardTabs';
import {revealVisibleChanges} from '@/client/utils/changeFlashRegistry';

export const boardTabState = reactive({
  active: 'mars' as BoardTabId,
});

export function selectBoardTab(id: BoardTabId): void {
  boardTabState.active = id;
  // Mars only turns visible again (visibility, no intersection change): changes placed on it while another
  // board was open blink now, once the new tab is drawn
  void nextTick(revealVisibleChanges);
}
