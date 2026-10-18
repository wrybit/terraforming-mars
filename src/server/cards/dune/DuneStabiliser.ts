import {IProjectCard} from '../IProjectCard';
import {Tag} from '../../../common/cards/Tag';
import {Card} from '../Card';
import {CardType} from '../../../common/cards/CardType';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';
import {Size} from '../../../common/cards/render/Size';

// Dune expansion, card E07 (mockup data/extension-cards.js)
export class DuneStabiliser extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.AUTOMATED,
      name: CardName.DUNE_STABILISER,
      tags: [Tag.PLANT],
      cost: 13,
      requirements: {oxygen: 6},
      behavior: {
        greenery: {},
      },

      metadata: {
        cardNumber: 'E07',
        renderData: CardRenderer.builder((b) => {
          b.greenery().br;
          b.text('The worm spares your greeneries.', {size: Size.SMALL});
        }),
        description: 'Place a greenery tile. The worm spares your greeneries.',
      },
    });
  }
}
