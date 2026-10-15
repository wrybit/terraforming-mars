import {ref} from 'vue';

// Analysis game: whether the log shows what the AI drafted, kept, bought and discarded (lines with the robot).
// Off by default since analysis games are the default: the AI's hand and picks would otherwise be an open book.
// Switched on in the log filter by whoever wants them. Remembered per browser.
const STORAGE_KEY = 'tm-ai-insights-shown';

function stored(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
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
