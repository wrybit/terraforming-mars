import {IProjectCard} from '../IProjectCard';
import {Tag} from '../../../common/cards/Tag';
import {Card} from '../Card';
import {CardType} from '../../../common/cards/CardType';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';
import {Size} from '../../../common/cards/render/Size';

// Dune expansion, card E09 (mockup data/extension-cards.js)
export class GuildBank extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.AUTOMATED,
      name: CardName.GUILD_BANK,
      tags: [Tag.SPACE],
      cost: 13,
      behavior: {
        production: {megacredits: 1},
      },

      metadata: {
        cardNumber: 'E09',
        renderData: CardRenderer.builder((b) => {
          b.production((pb) => pb.megacredits(1)).br;
          b.text('You may have 2 open offers at the CHOAM exchange.', {size: Size.SMALL});
        }),
        description: 'Increase your M€ production 1 step. You may have 2 open offers at the CHOAM exchange.',
      },
    });
  }
}
