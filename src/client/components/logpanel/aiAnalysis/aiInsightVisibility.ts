import {ref} from 'vue';

// Analysis game: whether the log shows what the AI drafted, kept, bought and discarded (lines with the robot).
// On by default; switched off they are hidden again like in a normal game. Remembered per browser.
const STORAGE_KEY = 'tm-ai-insights-shown';

function stored(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'false';
  } catch {
    return true;
  }
}

export const aiInsightsShown = ref(stored());

export function setAiInsightsShown(shown: boolean): void {
  aiInsightsShown.value = shown;
  try {
    localStorage.setItem(STORAGE_KEY, String(shown));
  } catch {
    // Without storage the switch only holds for this page
  }
}
