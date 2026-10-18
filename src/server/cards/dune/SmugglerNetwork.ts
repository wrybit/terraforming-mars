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
      cost: 10,

      metadata: {
        cardNumber: 'E10',
        renderData: CardRenderer.builder((b) => {
          b.effect('A bribe costs you 6 M€ instead of 10.', (eb) => eb.text('bribe').startEffect.megacredits(6));
        }),
      },
    });
  }
}
