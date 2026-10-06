// Which board tab (Mars, Moon, Colonies …) is open above the right column. Shared state, because
// inputs switch the board by themselves: placing a moon tile opens the Moon, trading opens the Colonies.
import {reactive} from 'vue';
import {BoardTabId} from './boardTabs';

export const boardTabState = reactive({
  active: 'mars' as BoardTabId,
});

export function selectBoardTab(id: BoardTabId): void {
  boardTabState.active = id;
}
