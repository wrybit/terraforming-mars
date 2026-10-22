import {IProjectCard} from '../IProjectCard';
import {Tag} from '../../../common/cards/Tag';
import {Card} from '../Card';
import {CardType} from '../../../common/cards/CardType';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';
import {Size} from '../../../common/cards/render/Size';
import {CardResource} from '../../../common/CardResource';

// Dune expansion, card E14 (mockup data/extension-cards.js)
export class ShieldGenerator extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.ACTIVE,
      name: CardName.SHIELD_GENERATOR,
      // Imperium tag (earth), 1 Sardaukar, from 8 % vegetation, 16 (Jens 22 Oct 2026)
      tags: [Tag.EARTH],
      requirements: {oxygen: 8},
      cost: 16,

      metadata: {
        cardNumber: 'E14',
        renderData: CardRenderer.builder((b) => {
          // Icons instead of words (Jens 21 Oct 2026): your tile on the war field, defended by 1 Sardaukar
          b.effect('When one of your tiles becomes the war field, 1 Sardaukar defends it for free.', (eb) => eb.emptyTile('normal', {size: Size.SMALL}).startEffect.resource(CardResource.FIGHTER, 1));
        }),
      },
    });
  }
}
