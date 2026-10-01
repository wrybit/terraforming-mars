import {PlayerInputModel} from '@/common/models/PlayerInputModel';

// Optionen, mit denen man nichts verändert ("Skip removing plants", "Do not steal", "Do nothing" …).
// Erkannt am englischen Server-Titel (vor der Übersetzung)
const SKIP_TITLE = /^(skip\b|do not\b|don't\b|do nothing\b)/i;

/* Ob die Option "nichts tun" bedeutet; solche Optionen stehen in jeder Auswahl als letzter Eintrag. */
export function isSkipOption(option: PlayerInputModel): boolean {
  const title = typeof option.title === 'string' ? option.title : option.title.message;
  return option.type === 'option' && SKIP_TITLE.test(title);
}
