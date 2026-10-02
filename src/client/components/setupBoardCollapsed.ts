import {ref} from 'vue';

// Whether the game board is collapsed during the setup phase. Shared state of PlayerHome.vue (hides the right
// column) and SetupBoardToggle.vue (button). Remembered per browser so the board does not expand again
// after a reload.

const STORAGE_KEY = 'setup-board-collapsed';

function readStored(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    // Private mode or similar: without storage, simply start expanded
    return false;
  }
}

export const setupBoardCollapsed = ref(readStored());

export function toggleSetupBoard(): void {
  setupBoardCollapsed.value = !setupBoardCollapsed.value;
  try {
    localStorage.setItem(STORAGE_KEY, setupBoardCollapsed.value ? '1' : '0');
  } catch {
    // Remembering is only a convenience
  }
}
