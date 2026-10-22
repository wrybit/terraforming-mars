import {IProjectCard} from '../IProjectCard';
import {Tag} from '../../../common/cards/Tag';
import {Card} from '../Card';
import {CardType} from '../../../common/cards/CardType';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';

// Dune expansion, card E01 (mockup data/extension-cards.js)
export class BazaarConcession extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.ACTIVE,
      name: CardName.BAZAAR_CONCESSION,
      tags: [Tag.BUILDING],
      // 3 Solari off up to 12 purchases: 17 (Jens 22 Oct 2026; was 9)
      cost: 17,

      metadata: {
        cardNumber: 'E01',
        renderData: CardRenderer.builder((b) => {
          b.effect('When you buy at the bazaar, you pay 3 M€ less.', (eb) => eb.text('bazaar').startEffect.megacredits(-3));
        }),
      },
    });
  }
}
