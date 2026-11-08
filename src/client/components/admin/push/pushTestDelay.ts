import {ref, watch} from 'vue';
import {safeLocalStorage} from '@/client/utils/SafeLocalStorage';

// Delay of the admin's test messages (page "Push"): browsers like Arc show no banner while a tab of the same
// site is in front, so the admin needs time to switch to another app. Remembered in this browser.

export const PUSH_TEST_DELAY_MIN = 1;
export const PUSH_TEST_DELAY_MAX = 60;
const DEFAULT_DELAY = 5;
const STORAGE_KEY = 'admin-push-test-delay';

export function clampDelay(value: number): number {
  return Number.isFinite(value) ? Math.min(PUSH_TEST_DELAY_MAX, Math.max(PUSH_TEST_DELAY_MIN, Math.round(value))) : DEFAULT_DELAY;
}

const stored = safeLocalStorage.getItem(STORAGE_KEY);

/** Seconds between the click on "Send test" and the sending, shared by all message cards */
export const pushTestDelaySeconds = ref(stored === null ? DEFAULT_DELAY : clampDelay(Number(stored)));

watch(pushTestDelaySeconds, (seconds) => safeLocalStorage.setItem(STORAGE_KEY, String(seconds)));
