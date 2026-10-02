import {Message} from '@/common/logs/Message';
import {PlayerInputModel} from '@/common/models/PlayerInputModel';
import {CardType} from '@/common/cards/CardType';
import {getCard} from '@/client/cards/ClientCardManifest';
import {previewTileForSpaceInput} from '@/client/components/spaceTilePreview';

// Color tone of the input tab depending on the kind of input (WaitingForTabs); colors in or_tab_tones.less.
// The action menu (OrOptions) stays neutral blue.
export type InputTone = 'prelude' | 'attack' | 'cards' | 'mars' | 'ocean' | 'city' | 'greenery' | 'resources' | 'player' | 'colonies';

// Attacks on other players can only be recognized by the server's English title key (no flag of their own);
// rare phrasings fall back to the color of their input type
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


function titleKey(title: string | Message): string {
  return typeof title === 'string' ? title : title.message;
}

// Preludes are pink like the cards themselves – recognizable when all offered cards are preludes
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
  // Space selection for ocean, city or greenery in the tile's color instead of Mars brown;
  // same detection as the tile preview (spaceTilePreview.ts)
  if (input.type === 'space') {
    const tile = previewTileForSpaceInput(input.title);
    if (tile !== undefined) {
      return tile;
    }
  }
  return TYPE_TONES[input.type];
}
