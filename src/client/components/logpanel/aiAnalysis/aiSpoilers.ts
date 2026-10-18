import {reactive} from 'vue';
import {LogMessage} from '@/common/logs/LogMessage';

// Analysis game: the AI's private lines (aiInsight) are blurred like a spoiler until the reader clicks them.
// A second click hides them again. Kept only for this page on purpose: after a reload everything is hidden again.
const revealed = reactive(new Set<string>());

// Analysis lines carry a stable id; the fallback keeps older lines apart by time and text
function keyOf(message: LogMessage): string {
  return message.id ?? `${message.timestamp}|${message.message}`;
}

export function isSpoiler(message: LogMessage): boolean {
  return message.aiInsight !== undefined;
}

export function isSpoilerHidden(message: LogMessage): boolean {
  return isSpoiler(message) && !revealed.has(keyOf(message));
}

/** Reveals a hidden spoiler or hides a revealed one; returns true if the line is hidden afterwards. */
export function toggleSpoiler(message: LogMessage): boolean {
  const key = keyOf(message);
  if (revealed.has(key)) {
    revealed.delete(key);
    return true;
  }
  revealed.add(key);
  return false;
}
