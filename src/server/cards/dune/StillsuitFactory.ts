import {IProjectCard} from '../IProjectCard';
import {Tag} from '../../../common/cards/Tag';
import {Card} from '../Card';
import {CardType} from '../../../common/cards/CardType';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';

// Dune expansion, card E16 (mockup data/extension-cards.js)
export class StillsuitFactory extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.AUTOMATED,
      name: CardName.STILLSUIT_FACTORY,
      tags: [Tag.BUILDING],
      cost: 13,
      victoryPoints: 1,
      behavior: {
        production: {heat: 1, megacredits: 1},
      },

      metadata: {
        cardNumber: 'E16',
        renderData: CardRenderer.builder((b) => {
          b.production((pb) => pb.heat(1).megacredits(1));
        }),
        description: 'Increase your heat production and your M€ production 1 step each.',
      },
    });
  }
}
