import {IProjectCard} from '../IProjectCard';
import {Tag} from '../../../common/cards/Tag';
import {Card} from '../Card';
import {CardType} from '../../../common/cards/CardType';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';

// Dune expansion, card E14 (mockup data/extension-cards.js)
export class ShieldGenerator extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.ACTIVE,
      name: CardName.SHIELD_GENERATOR,
      tags: [Tag.BUILDING],
      cost: 14,

      metadata: {
        cardNumber: 'E14',
        renderData: CardRenderer.builder((b) => {
          b.effect('When one of your tiles becomes the war field, 2 Sardaukar defend it for free.', (eb) => eb.text('war field').startEffect.text('2 Sardaukar'));
        }),
      },
    });
  }
}
