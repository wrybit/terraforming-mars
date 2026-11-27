// Opens the feedback overlay from anywhere: key O (FeedbackOverlay.vue listens), the menu (GameMenu.vue) or shaking.
import {ref} from 'vue';
import {isTypingTarget} from '@/client/utils/typingTarget';

export const feedbackOpen = ref(false);

export function openFeedback(): void {
  feedbackOpen.value = true;
}

export function closeFeedback(): void {
  feedbackOpen.value = false;
}

export function isFeedbackHotkey(event: KeyboardEvent): boolean {
  return event.code === 'KeyO' && !event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey &&
    !event.repeat && !isTypingTarget(event.target);
}
