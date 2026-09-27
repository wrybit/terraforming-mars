import {Message} from '@/common/logs/Message';

// Kurze Tab-Beschriftungen für das Aktionsmenü, damit die Tab-Leiste einzeilig bleibt.
// Schlüssel = englischer Titel-Schlüssel vom Server (Player.ts u. a.), Wert = kurzer Schlüssel (übersetzt in locales/*/ui.json).
// Unbekannte Titel bleiben unverändert; der volle Titel steht immer im Tooltip.
const SHORT_LABELS: Readonly<Record<string, string>> = {
  'Play project card': 'Play cards',
  'Perform an action from a played card': 'Card action',
  'Standard projects': 'Projects',
  'Pass for this generation': 'Pass',
  'Sell patents': 'Patents',
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
