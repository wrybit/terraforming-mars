import {Message} from '@/common/logs/Message';
import {BAZAAR_BUY_TITLE} from '@/common/dune/duneActionTitles';
import {titleKey} from '@/client/components/orOptionsShortLabels';

// Options of the action menu that get a tab only when asked for from elsewhere (actionTabRequest.ts): buying a bazaar
// ware appears as a tab only after a tap on that ware, and disappears again when another tab is chosen
// (Jens, 19 Oct 2026). Desktop tab bar (OrOptions.vue) and phone turn sheet (turnMenu.ts) both leave them out.
const ON_REQUEST_TITLES: ReadonlySet<string> = new Set([BAZAAR_BUY_TITLE]);

export function isOnRequestTab(title: string | Message): boolean {
  return ON_REQUEST_TITLES.has(titleKey(title));
}
