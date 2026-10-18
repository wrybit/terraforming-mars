import {IProjectCard} from '../IProjectCard';
import {Tag} from '../../../common/cards/Tag';
import {Card} from '../Card';
import {CardType} from '../../../common/cards/CardType';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';

// Dune expansion, card E06 (mockup data/extension-cards.js)
export class WormRider extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.ACTIVE,
      name: CardName.WORM_RIDER,
      tags: [Tag.ANIMAL],
      cost: 16,
      requirements: {oxygen: 4},
      victoryPoints: 1,

      metadata: {
        cardNumber: 'E06',
        renderData: CardRenderer.builder((b) => {
          b.effect('When the worm crosses a space next to one of your tiles, gain 2 titanium.', (eb) => eb.text('worm').startEffect.titanium(2));
        }),
      },
    });
  }
}
