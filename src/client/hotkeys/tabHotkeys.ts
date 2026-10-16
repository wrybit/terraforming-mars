// Shortcut of a tab of the action menu, from the (English) title of its input; undefined for tabs without one
import {Message} from '@/common/logs/Message';
import {PlayerInputModel} from '@/common/models/PlayerInputModel';

const TAB_HOTKEYS: Readonly<Record<string, string>> = {
  'Play project card': 'tab-projects',
  'Perform an action from a played card': 'tab-actions',
  'Standard projects': 'tab-standard',
  'Sell patents': 'tab-sell',
  'Claim a milestone': 'tab-milestone',
  'Fund an award (${0} M€)': 'tab-award',
  'Take first action of ${0} corporation': 'tab-corporation',
  'Convert ${0} plants into greenery': 'tab-place',
  'Convert 8 heat into temperature': 'tab-temperature',
  'Convert 6 heat into temperature': 'tab-temperature',
  'Trade with a colony tile': 'tab-trade',
  'Send a delegate in an area (3 M€)': 'tab-delegate',
  'Send a delegate in an area (5 M€)': 'tab-delegate',
  'Send a delegate in an area (from lobby)': 'tab-delegate',
  'Use CEO once per game action': 'tab-ceo',
  'End Turn': 'tab-pass',
  'Pass for this generation': 'tab-end',
  'Undo last action': 'undo',
};

function titleText(title: string | Message): string {
  return typeof title === 'string' ? title : title.message;
}

export function tabHotkey(title: string | Message, input?: PlayerInputModel): string | undefined {
  const byTitle = TAB_HOTKEYS[titleText(title)];
  if (byTitle !== undefined) {
    return byTitle;
  }
  // Placing a tile (city, ocean, greenery, special tile …) shares the key of the greenery tab
  return input?.type === 'space' ? 'tab-place' : undefined;
}
