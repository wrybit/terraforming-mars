import {Message} from '@/common/logs/Message';
import {PlayerInputModel} from '@/common/models/PlayerInputModel';
import {CardType} from '@/common/cards/CardType';
import {getCard} from '@/client/cards/ClientCardManifest';

// Farbton des Eingabe-Tabs je nach Art der Eingabe (WaitingForTabs); Farben in or_tab_tones.less.
// Das Aktionsmenü (OrOptions) bleibt neutral blau.
export type InputTone = 'prelude' | 'attack' | 'cards' | 'mars' | 'ocean' | 'city' | 'resources' | 'player' | 'colonies';

// Angriffe auf Mitspieler erkennt man nur am englischen Titel-Schlüssel des Servers (kein eigenes Kennzeichen);
// seltene Formulierungen fallen auf die Farbe ihres Eingabetyps zurück
const ATTACK_PATTERN = /\b(steal|blackmail|sue|sting)\b|^Select player to (decrease|remove|discard|lose)|^Remove \$\{0\}.* from \$\{/i;

const TYPE_TONES: Readonly<Partial<Record<PlayerInputModel['type'], InputTone>>> = {
  card: 'cards',
  projectCard: 'cards',
  initialCards: 'cards',
  space: 'mars',
  amount: 'resources',
  resource: 'resources',
  resources: 'resources',
  productionToLose: 'resources',
  payment: 'resources',
  player: 'player',
  colony: 'colonies',
  party: 'colonies',
  delegate: 'colonies',
  globalEvent: 'colonies',
};

// Feldwahl für einen Ozean (nur dann blau statt Mars-braun); erkennbar am englischen Titel-Schlüssel,
// z. B. "Select space for ocean tile" oder "Select space for first ocean"
const OCEAN_PATTERN = /\bocean\b/i;
// Feldwahl für eine Stadt: hellgrau wie die Stadtplättchen
const CITY_PATTERN = /\bcity\b/i;

function titleKey(title: string | Message): string {
  return typeof title === 'string' ? title : title.message;
}

// Präludien sind rosa wie die Karten selbst – erkennbar, wenn alle angebotenen Karten Präludien sind
function offersOnlyPreludes(input: PlayerInputModel): boolean {
  if (input.type !== 'card' || input.cards.length === 0) {
    return false;
  }
  return input.cards.every((card) => getCard(card.name)?.type === CardType.PRELUDE);
}

export function inputTone(input: PlayerInputModel): InputTone | undefined {
  if (ATTACK_PATTERN.test(titleKey(input.title))) {
    return 'attack';
  }
  if (offersOnlyPreludes(input)) {
    return 'prelude';
  }
  if (input.type === 'space' && OCEAN_PATTERN.test(titleKey(input.title))) {
    return 'ocean';
  }
  if (input.type === 'space' && CITY_PATTERN.test(titleKey(input.title))) {
    return 'city';
  }
  return TYPE_TONES[input.type];
}
