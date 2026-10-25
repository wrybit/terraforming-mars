import {IProjectCard} from '../IProjectCard';
import {Tag} from '../../../common/cards/Tag';
import {Card} from '../Card';
import {CardType} from '../../../common/cards/CardType';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';

// Dune expansion, card E10 (mockup data/extension-cards.js)
export class SmugglerNetwork extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.ACTIVE,
      name: CardName.SMUGGLER_NETWORK,
      tags: [Tag.BUILDING],
      // A discount like the other discount cards: −4 per bribe, about 5 bribes = 20 (Jens 22 Oct 2026; was 10)
      cost: 15,

      metadata: {
        cardNumber: 'E10',
        renderData: CardRenderer.builder((b) => {
          // The tribute to the great houses in the CHOAM tab, which lowers the envy (Jens 25 Oct 2026)
          b.effect('A tribute to the great houses costs you 4 M€ less.', (eb) => eb.text('tribute').startEffect.megacredits(-4));
        }),
      },
    });
  }
}
