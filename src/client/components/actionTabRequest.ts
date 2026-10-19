import {reactive} from 'vue';
import {Message} from '@/common/logs/Message';
import {PlayerInputModel} from '@/common/models/PlayerInputModel';
import {titleKey} from '@/client/components/orOptionsShortLabels';

// Request from elsewhere in the view (e.g. a button in a Dune module tab) to open a tab of the action menu, found
// by its English title. The action menu (OrOptions.vue, desktop) and the phone home (MobilePlayerHome.vue) react
// only to a NEW request (`at` changes) – never on mount – so a request can't select an option again after the next
// server update. It only opens the tab; nothing is ever submitted from here.

export const actionTabRequest = reactive({
  title: undefined as string | undefined,
  // Value inside the title that tells options of the same title apart (e.g. the ware of a bazaar purchase)
  value: undefined as string | undefined,
  at: 0,
});

export function requestActionTab(title: string, value?: string): void {
  actionTabRequest.title = title;
  actionTabRequest.value = value;
  actionTabRequest.at = Date.now();
}

function hasValue(title: string | Message, value: string): boolean {
  return typeof title !== 'string' && title.data.some((entry) => String(entry.value) === value);
}

/** Index of the requested option among `options`, or -1 */
export function requestedTabIndex(options: ReadonlyArray<PlayerInputModel>): number {
  const wanted = actionTabRequest.title;
  if (wanted === undefined) {
    return -1;
  }
  const value = actionTabRequest.value;
  return options.findIndex((option) => titleKey(option.title as string | Message) === wanted &&
    (value === undefined || hasValue(option.title as string | Message, value)));
}
