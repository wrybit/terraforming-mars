import {IProjectCard} from '../IProjectCard';
import {Card} from '../Card';
import {CardType} from '../../../common/cards/CardType';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';

// Dune expansion, card E15 (mockup data/extension-cards.js)
export class WaterOfLife extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.EVENT,
      name: CardName.WATER_OF_LIFE,
      tags: [],
      cost: 20,
      requirements: {oxygen: 8},
      behavior: {
        tr: 2,
        drawCard: 2,
      },

      metadata: {
        cardNumber: 'E15',
        renderData: CardRenderer.builder((b) => {
          b.tr(2).cards(2);
        }),
        description: 'Raise your TR 2 steps. Draw 2 cards.',
      },
    });
  }
}
