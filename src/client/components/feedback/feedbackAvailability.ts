import {ref} from 'vue';
import {FEEDBACK_DISABLED, FEEDBACK_PATHS, FeedbackConfig} from '@/common/feedback/feedbackPaths';

// Whether this server has the feedback switched on (Admin → Settings → Feedback), asked once per page load:
// menu entry, key, shaking and the overlay depend on it.
export const feedbackConfig = ref<FeedbackConfig>(FEEDBACK_DISABLED);
let loading: Promise<void> | undefined;

export function loadFeedbackConfig(): Promise<void> {
  loading ??= (async () => {
    try {
      const response = await fetch(FEEDBACK_PATHS.config);
      feedbackConfig.value = response.ok ? await response.json() as FeedbackConfig : FEEDBACK_DISABLED;
    } catch {
      // Unreachable server: no feedback, the game itself goes on
      feedbackConfig.value = FEEDBACK_DISABLED;
    }
  })();
  return loading;
}

/** for tests */
export function resetFeedbackConfig(config: FeedbackConfig = FEEDBACK_DISABLED): void {
  feedbackConfig.value = config;
  loading = config === FEEDBACK_DISABLED ? undefined : Promise.resolve();
}
