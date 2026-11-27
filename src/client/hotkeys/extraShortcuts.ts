import {CLIENT_EXTENSIONS} from '@/genfiles/extensionsClient';
import {feedbackConfig} from '@/client/components/feedback/feedbackAvailability';

// Fixed keys beside the configurable shortcuts: the feedback (when switched on) and those of installed extensions.
// Listed in the shortcut dialog and drawn on its keyboard.
export type ExtraShortcut = {
  id: string,
  /** English text for the list */
  label: string,
  /** Shorter English text on the drawn keyboard */
  short: string,
  /** Position of the key (KeyboardEvent.code) */
  key: string,
};

export function extraShortcuts(): Array<ExtraShortcut> {
  const feedback: Array<ExtraShortcut> = feedbackConfig.value.enabled ? [{id: 'feedback', label: 'Send feedback', short: 'Feedback', key: 'KeyO'}] : [];
  const extensions = CLIENT_EXTENSIONS.flatMap((extension) => (extension.shortcuts ?? []).map((shortcut) => ({
    id: 'extension-' + extension.name + '-' + shortcut.key,
    label: shortcut.label,
    short: shortcut.short ?? shortcut.label,
    key: shortcut.key,
  })));
  return [...feedback, ...extensions];
}
