// Tabs of the action menu without a count badge: in the trade tabs of Dune something is always possible
// (an offer, a bribe), so the number would always be there and tell nothing (Jens, 19 Oct 2026)
import {Message} from '@/common/logs/Message';
import {CHOAM_TITLE, SMUGGLE_TITLE} from '@/common/dune/duneActionTitles';

const UNCOUNTED_TITLES: ReadonlySet<string> = new Set([CHOAM_TITLE, SMUGGLE_TITLE]);

export function isUncountedTab(title: string | Message): boolean {
  return UNCOUNTED_TITLES.has(typeof title === 'string' ? title : title.message);
}
