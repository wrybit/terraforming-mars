import {Message} from '@/common/logs/Message';

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
  'Convert ${0} plants into greenery': 'Greenery',
  'Convert 8 heat into temperature': 'Temperature',
  'Convert 6 heat into temperature': 'Temperature',
  'Trade with a colony tile': 'Trade',
  'Send a delegate in an area (3 M€)': 'Delegate (3 M€)',
  'Send a delegate in an area (5 M€)': 'Delegate (5 M€)',
  'Send a delegate in an area (from lobby)': 'Delegate (lobby)',
  'Use CEO once per game action': 'CEO action',
  'Undo last action': 'Undo',
};

// Tabs, die statt Text nur ein Icon zeigen (Icons in OrOptionsTabIcon.vue)
export type TabIcon = 'sell' | 'pass-on' | 'end-generation';
const TAB_ICONS: Readonly<Record<string, TabIcon>> = {
  'Sell patents': 'sell',
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
};

// Farbe des Buttons für Optionen mit deutlicher Tragweite (Styles in or_options_tabs.less)
export type TabButtonTone = 'danger' | 'success';
const BUTTON_TONES: Readonly<Record<string, TabButtonTone>> = {
  'Pass for this generation': 'danger', // Runde beenden: für diese Generation raus
  'End Turn': 'success', // Weitergeben: Zug regulär abgeben
};

function titleKey(title: string | Message): string {
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

export function tabIcon(title: string | Message): TabIcon | undefined {
  return TAB_ICONS[titleKey(title)];
}

// Anzeige-Reihenfolge der Tabs als Liste von Indizes; alle anderen behalten ihre Server-Reihenfolge
export function tabDisplayOrder(titles: ReadonlyArray<string | Message>): Array<number> {
  const rank = (index: number) => LAST_TABS.indexOf(titleKey(titles[index]));
  return titles.map((_title, index) => index).sort((a, b) => rank(a) - rank(b) || a - b);
}
