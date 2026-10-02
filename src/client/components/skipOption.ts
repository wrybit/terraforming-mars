import {PlayerInputModel} from '@/common/models/PlayerInputModel';

// Options that change nothing ("Skip removing plants", "Do not steal", "Do nothing" …).
// Recognized by the English server title (before translation)
const SKIP_TITLE = /^(skip\b|do not\b|don't\b|do nothing\b)/i;

/* Whether the option means "do nothing"; such options are the last entry in every selection. */
export function isSkipOption(option: PlayerInputModel): boolean {
  const title = typeof option.title === 'string' ? option.title : option.title.message;
  return option.type === 'option' && SKIP_TITLE.test(title);
}
