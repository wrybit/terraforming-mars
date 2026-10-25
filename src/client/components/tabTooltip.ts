import {keysOf} from '@/client/hotkeys/hotkeyStore';
import {keyCapLabel} from '@/client/hotkeys/hotkeyEvents';

// Tooltip of an action tab: the full title and its shortcut, which the tab itself drops when space runs short
// (TabSteps.ts). Without shortcuts switched on (class tm-hotkeys on <html>) only the title.
export function tabTooltip(title: string, hotkeyAction: string | undefined): string {
  const shortcutsShown = typeof document !== 'undefined' && document.documentElement.classList.contains('tm-hotkeys');
  const keys = hotkeyAction === undefined || !shortcutsShown ? [] : keysOf(hotkeyAction).filter((key) => key !== '…').map(keyCapLabel);
  return keys.length === 0 ? title : `${title} (${keys.join(' ')})`;
}
