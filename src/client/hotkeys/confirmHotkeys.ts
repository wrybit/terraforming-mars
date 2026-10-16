// Two keys send an answer: Enter for binding steps that spend or end something (pay, buy, discard, sell, place a
// tile for good, pass, end the generation), Space for routine steps (choose, continue, navigate). Two different
// keys make the player act consciously on the binding ones; the wrong key only shakes the button (hotkeyDispatcher.ts).
import {Message} from '@/common/logs/Message';

export type ConfirmHotkey = 'confirm' | 'proceed';

// Tabs of the action menu whose button spends something or ends the turn (tabHotkeys.ts)
const BINDING_TABS: ReadonlySet<string> = new Set([
  'tab-projects', 'tab-standard', 'tab-sell', 'tab-milestone', 'tab-award', 'tab-trade', 'tab-pass', 'tab-end',
]);

// Button labels of card selections (server texts) that spend or lose something
const BINDING_LABELS: ReadonlySet<string> = new Set(['Buy', 'Discard', 'Sell', 'Play', 'Spend Corruption']);

export function tabConfirmHotkey(tabHotkey: string | undefined): ConfirmHotkey {
  return tabHotkey !== undefined && BINDING_TABS.has(tabHotkey) ? 'confirm' : 'proceed';
}

export function labelConfirmHotkey(label: string | Message): ConfirmHotkey {
  return BINDING_LABELS.has(typeof label === 'string' ? label : label.message) ? 'confirm' : 'proceed';
}
