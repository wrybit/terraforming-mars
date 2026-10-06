import {Message} from '@/common/logs/Message';
import {PlayerInputModel} from '@/common/models/PlayerInputModel';
import {PreviewTile, previewTileForSpaceInput} from '@/client/components/spaceTilePreview';

// Short tab labels, icons and order for the action menu, so the tab bar stays on one line.
// Key = English title key from the server (Player.ts etc.), value = short key (translated in locales/*/ui.json).
// Unknown titles stay unchanged; the full title is always in the tooltip.
const SHORT_LABELS: Readonly<Record<string, string>> = {
  'Play project card': 'Play cards',
  'Perform an action from a played card': 'Actions',
  'Standard projects': 'Standard',
  'Pass for this generation': 'End generation',
  'End Turn': 'Pass on',
  'Sell patents': 'Sell',
  'Claim a milestone': 'Milestone',
  'Fund an award (${0} M€)': 'Award (${0} M€)',
  'Take first action of ${0} corporation': 'Corporation action',
  'Convert ${0} plants into greenery': 'Place greenery',
  'Convert 8 heat into temperature': 'Increase the temperature',
  'Convert 6 heat into temperature': 'Increase the temperature',
  'Trade with a colony tile': 'Trade',
  'Send a delegate in an area (3 M€)': 'Delegate (3 M€)',
  'Send a delegate in an area (5 M€)': 'Delegate (5 M€)',
  'Send a delegate in an area (from lobby)': 'Delegate (lobby)',
  'Use CEO once per game action': 'CEO action',
  'Undo last action': 'Undo',
  // Initial selection (SelectInitialCards, titles from common/inputs/SelectInitialCards.ts)
  'Select corporation': 'Corporation',
  'Select 2 Prelude cards': 'Prelude cards',
  'Select CEO': 'CEO',
  'Select initial cards to buy': 'Buy cards',
  // Inputs outside the action menu (WaitingForTabs)
  'Select card(s) to buy': 'Buy cards',
  'Select a card to keep': 'Keep card',
  'Select a card to keep and pass the rest to ${0}': 'Keep card',
  'Select two cards to keep and pass the rest to ${0}': 'Keep cards',
};

// Tab label by input type when the title has no short label (WaitingForTabs);
// the full title is shown there anyway as a heading above the tabs
const INPUT_TYPE_LABELS: Readonly<Partial<Record<PlayerInputModel['type'], string>>> = {
  card: 'Cards',
  projectCard: 'Cards',
  space: 'Place tile',
  player: 'Player',
  amount: 'Amount',
  colony: 'Colony',
  option: 'Confirm',
  resource: 'Resources',
  resources: 'Resources',
  party: 'Party',
  delegate: 'Delegate',
  payment: 'Payment',
};
const DEFAULT_INPUT_LABEL = 'Choice';

// Tabs that show only an icon instead of text (icons in OrOptionsTabIcon.vue)
export type TabIcon = 'pass-on' | 'end-generation';
const TAB_ICONS: Readonly<Record<string, TabIcon>> = {
  'End Turn': 'pass-on',
  'Pass for this generation': 'end-generation',
};

// These tabs always come last, in this order (end generation at the very end)
const LAST_TABS: ReadonlyArray<string> = ['End Turn', 'Pass for this generation'];

// Expansion actions (trade, send delegate): tab color of their board tab (boardTabs.ts), placed rightmost
// among the regular actions, directly before pass/end
const EXPANSION_TAB_TONES: Readonly<Record<string, OptionTone>> = {
  'Trade with a colony tile': 'colonies',
  'Send a delegate in an area (3 M€)': 'colonies',
  'Send a delegate in an area (5 M€)': 'colonies',
  'Send a delegate in an area (from lobby)': 'colonies',
};

// Custom button texts for individual options in the action menu (server delivers e.g. only "Pass");
// key = title key of the option, value = button key (translated in locales/*/ui.json)
const BUTTON_LABELS: Readonly<Record<string, string>> = {
  'Pass for this generation': 'End round',
  'End Turn': 'Pass on',
  'Convert 8 heat into temperature': 'Increase the temperature',
  'Convert 6 heat into temperature': 'Increase the temperature',
};

// Button color for options with significant consequences (styles in or_options_tabs.less)
export type TabButtonTone = 'danger' | 'success' | 'heat';
const BUTTON_TONES: Readonly<Record<string, TabButtonTone>> = {
  'Pass for this generation': 'danger', // End generation: out for this generation
  'End Turn': 'success', // Pass on: hand over the turn normally
  'Convert ${0} plants into greenery': 'success', // Place greenery: green like the tile
  'Convert 8 heat into temperature': 'heat', // Raise temperature: orange like heat
  'Convert 6 heat into temperature': 'heat',
};

// Tabs that should catch the eye (bold, slightly larger; style in or_options_tabs.less):
// rare, valuable opportunities that are easily overlooked during a turn
const HIGHLIGHTED_TABS: ReadonlySet<string> = new Set([
  'Claim a milestone',
  'Convert ${0} plants into greenery',
  'Convert 8 heat into temperature',
  'Convert 6 heat into temperature',
]);

export function titleKey(title: string | Message): string {
  return typeof title === 'string' ? title : title.message;
}

// Always returns a copy: translateMessage() (i18n.ts) overwrites message.message in the passed object,
// otherwise the original would be translated and the lookup by English key would find nothing
export function shortTabLabel(title: string | Message): string | Message {
  if (typeof title === 'string') {
    return SHORT_LABELS[title] ?? title;
  }
  // Parameters (e.g. costs) are preserved
  return {...title, message: SHORT_LABELS[title.message] ?? title.message};
}

// Full title for the tooltip, also as a copy (see above)
export function fullTabTitle(title: string | Message): string | Message {
  return typeof title === 'string' ? title : {...title};
}

export function tabButtonLabel(title: string | Message, serverLabel: string): string {
  return BUTTON_LABELS[titleKey(title)] ?? serverLabel;
}

export function tabButtonTone(title: string | Message): TabButtonTone | undefined {
  return BUTTON_TONES[titleKey(title)];
}

export function inputTabLabel(input: PlayerInputModel): string | Message {
  if (SHORT_LABELS[titleKey(input.title)] !== undefined) {
    return shortTabLabel(input.title);
  }
  return INPUT_TYPE_LABELS[input.type] ?? DEFAULT_INPUT_LABEL;
}

export function tabHighlighted(title: string | Message): boolean {
  return HIGHLIGHTED_TABS.has(titleKey(title));
}

export function tabIcon(title: string | Message): TabIcon | undefined {
  return TAB_ICONS[titleKey(title)];
}

// Tabs without content of their own (SelectOption: only a button, e.g. raise temperature, corporation first action):
// the button sits large in the middle of the box instead of in the footer (tab_panel_footer.less).
// Pass/end have their own centered layout (or-tab-panel--end).
export function tabButtonCentered(option: PlayerInputModel): boolean {
  return option.type === 'option' && !isEndTab(option.title);
}

// Tab color of an action: fixed tones by title, otherwise for a content-free option the tile its button
// announces (e.g. Tharsis Republic "Place a city tile" -> gray like the city tab that follows)
export type OptionTone = TabButtonTone | PreviewTile | 'colonies' | 'milestones';

// Milestone and award tabs: dark gold like the milestones & awards box (or_tab_tones.less: milestones)
const GOLD_TAB_TONES: Readonly<Record<string, OptionTone>> = {
  'Claim a milestone': 'milestones',
  'Fund an award (${0} M€)': 'milestones',
};

export function optionTone(option: PlayerInputModel): OptionTone | undefined {
  const key = titleKey(option.title);
  const tone = tabButtonTone(option.title) ?? EXPANSION_TAB_TONES[key] ?? GOLD_TAB_TONES[key];
  if (tone !== undefined || option.type !== 'option') {
    return tone;
  }
  return previewTileForSpaceInput(option.buttonLabel);
}

// Explanation above the pass-on button (end generation brings its own warning from the server, WarningsComponent.vue)
const END_TAB_HINTS: Readonly<Record<string, string>> = {
  'End Turn': 'Your turn ends here. The other players continue, and you will get another turn this generation.',
};

export function endTabHint(title: string | Message): string | undefined {
  return END_TAB_HINTS[titleKey(title)];
}

// Pass on/end generation: set apart right-aligned from the other actions (or_options_tabs.less)
export function isEndTab(title: string | Message): boolean {
  return LAST_TABS.includes(titleKey(title));
}

// Display order of the tabs as a list of indices; all others keep their server order
export function tabDisplayOrder(titles: ReadonlyArray<string | Message>): Array<number> {
  const rank = (index: number) => {
    const key = titleKey(titles[index]);
    const last = LAST_TABS.indexOf(key);
    return last !== -1 ? 2 + last : EXPANSION_TAB_TONES[key] !== undefined ? 1 : 0;
  };
  return titles.map((_title, index) => index).sort((a, b) => rank(a) - rank(b) || a - b);
}
