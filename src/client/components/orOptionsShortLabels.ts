import {Message} from '@/common/logs/Message';
import {PlayerInputModel} from '@/common/models/PlayerInputModel';

// Kurze Tab-Beschriftungen, Icons und Reihenfolge für das Aktionsmenü, damit die Tab-Leiste einzeilig bleibt.
// Schlüssel = englischer Titel-Schlüssel vom Server (Player.ts u. a.), Wert = kurzer Schlüssel (übersetzt in locales/*/ui.json).
// Unbekannte Titel bleiben unverändert; der volle Titel steht immer im Tooltip.
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
  // Startauswahl (SelectInitialCards, Titel aus common/inputs/SelectInitialCards.ts)
  'Select corporation': 'Corporation',
  'Select 2 Prelude cards': 'Prelude cards',
  'Select CEO': 'CEO',
  'Select initial cards to buy': 'Buy cards',
  // Eingaben außerhalb des Aktionsmenüs (WaitingForTabs)
  'Select card(s) to buy': 'Buy cards',
  'Select a card to keep': 'Keep card',
  'Select a card to keep and pass the rest to ${0}': 'Keep card',
  'Select two cards to keep and pass the rest to ${0}': 'Keep cards',
};

// Tab-Beschriftung nach Art der Eingabe, wenn der Titel kein Kurzlabel hat (WaitingForTabs);
// der volle Titel steht dort ohnehin als Überschrift über den Tabs
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

// Tabs, die statt Text nur ein Icon zeigen (Icons in OrOptionsTabIcon.vue)
export type TabIcon = 'pass-on' | 'end-generation';
const TAB_ICONS: Readonly<Record<string, TabIcon>> = {
  'End Turn': 'pass-on',
  'Pass for this generation': 'end-generation',
};

// Diese Tabs stehen immer am Ende, in dieser Reihenfolge (Beenden ganz zuletzt)
const LAST_TABS: ReadonlyArray<string> = ['End Turn', 'Pass for this generation'];

// Eigene Button-Texte für einzelne Optionen im Aktionsmenü (Server liefert z. B. nur "Pass");
// Schlüssel = Titel-Schlüssel der Option, Wert = Button-Schlüssel (übersetzt in locales/*/ui.json)
const BUTTON_LABELS: Readonly<Record<string, string>> = {
  'Pass for this generation': 'End round',
  'End Turn': 'Pass on',
  'Convert 8 heat into temperature': 'Increase the temperature',
  'Convert 6 heat into temperature': 'Increase the temperature',
};

// Farbe des Buttons für Optionen mit deutlicher Tragweite (Styles in or_options_tabs.less)
export type TabButtonTone = 'danger' | 'success' | 'heat';
const BUTTON_TONES: Readonly<Record<string, TabButtonTone>> = {
  'Pass for this generation': 'danger', // Runde beenden: für diese Generation raus
  'End Turn': 'success', // Weitergeben: Zug regulär abgeben
  'Convert ${0} plants into greenery': 'success', // Grünfläche platzieren: grün wie das Plättchen
  'Convert 8 heat into temperature': 'heat', // Temperatur erhöhen: orange wie Wärme
  'Convert 6 heat into temperature': 'heat',
};

// Tabs, die ins Auge fallen sollen (fett, etwas größer; Stil in or_options_tabs.less):
// seltene, wertvolle Gelegenheiten, die man im Zug leicht übersieht
const HIGHLIGHTED_TABS: ReadonlySet<string> = new Set([
  'Claim a milestone',
  'Convert ${0} plants into greenery',
  'Convert 8 heat into temperature',
  'Convert 6 heat into temperature',
]);

export function titleKey(title: string | Message): string {
  return typeof title === 'string' ? title : title.message;
}

// Liefert immer eine Kopie: translateMessage() (i18n.ts) überschreibt message.message im übergebenen Objekt,
// sonst würde das Original übersetzt und die Zuordnung per englischem Schlüssel fände nichts mehr
export function shortTabLabel(title: string | Message): string | Message {
  if (typeof title === 'string') {
    return SHORT_LABELS[title] ?? title;
  }
  // Parameter (z. B. Kosten) bleiben erhalten
  return {...title, message: SHORT_LABELS[title.message] ?? title.message};
}

// Voller Titel für den Tooltip, ebenfalls als Kopie (siehe oben)
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

// Tabs ohne eigene Auswahl, deren Button mittig in der Box statt im Fuß sitzt (tab_panel_footer.less)
const CENTERED_BUTTON_TABS: ReadonlySet<string> = new Set([
  'Convert 8 heat into temperature',
  'Convert 6 heat into temperature',
]);

export function tabButtonCentered(title: string | Message): boolean {
  return CENTERED_BUTTON_TABS.has(titleKey(title));
}

// Erklärung über dem Button von Weitergeben (Beenden bringt eine eigene Warnung vom Server mit, WarningsComponent.vue)
const END_TAB_HINTS: Readonly<Record<string, string>> = {
  'End Turn': 'Your turn ends here. The other players continue, and you will get another turn this generation.',
};

export function endTabHint(title: string | Message): string | undefined {
  return END_TAB_HINTS[titleKey(title)];
}

// Weitergeben/Beenden: stehen rechtsbündig abgesetzt von den übrigen Aktionen (or_options_tabs.less)
export function isEndTab(title: string | Message): boolean {
  return LAST_TABS.includes(titleKey(title));
}

// Anzeige-Reihenfolge der Tabs als Liste von Indizes; alle anderen behalten ihre Server-Reihenfolge
export function tabDisplayOrder(titles: ReadonlyArray<string | Message>): Array<number> {
  const rank = (index: number) => LAST_TABS.indexOf(titleKey(titles[index]));
  return titles.map((_title, index) => index).sort((a, b) => rank(a) - rank(b) || a - b);
}
