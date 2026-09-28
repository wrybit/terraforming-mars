import {ref} from 'vue';

// Ob der Spielplan in der Startphase eingeklappt ist. Gemeinsamer Zustand von PlayerHome.vue (blendet die rechte
// Spalte aus), SetupBoardToggle.vue (Button) und SelectInitialCards.vue (holt die Leiste mit "Beginne" nach links,
// weil ihr Platz in der rechten Spalte dann fehlt). Gemerkt pro Browser, damit der Plan nach dem Neuladen nicht
// wieder aufklappt.

const STORAGE_KEY = 'setup-board-collapsed';

function readStored(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    // Privater Modus o. Ä.: ohne Speicher einfach ausgeklappt starten
    return false;
  }
}

export const setupBoardCollapsed = ref(readStored());

export function toggleSetupBoard(): void {
  setupBoardCollapsed.value = !setupBoardCollapsed.value;
  try {
    localStorage.setItem(STORAGE_KEY, setupBoardCollapsed.value ? '1' : '0');
  } catch {
    // Merken ist nur Komfort
  }
}
