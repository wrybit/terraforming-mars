import {IProjectCard} from '../IProjectCard';
import {Tag} from '../../../common/cards/Tag';
import {Card} from '../Card';
import {CardType} from '../../../common/cards/CardType';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';
import {Size} from '../../../common/cards/render/Size';
import {IPlayer} from '../../IPlayer';
import {PlayerInput} from '../../PlayerInput';
import {takeFreeWare} from '../../dune/Bazaar';

// Dune expansion, card E02 (mockup data/extension-cards.js)
export class CaravanMaster extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.AUTOMATED,
      name: CardName.CARAVAN_MASTER,
      tags: [Tag.EARTH],
      cost: 14,
      behavior: {
        production: {megacredits: 2},
      },

      metadata: {
        cardNumber: 'E02',
        renderData: CardRenderer.builder((b) => {
          b.production((pb) => pb.megacredits(2)).br;
          b.text('Take the ware in the −6 slot of the bazaar for free.', {size: Size.SMALL});
        }),
        description: 'Increase your M€ production 2 steps. Take the ware in the −6 slot of the bazaar for free.',
      },
    });
  }

  public override bespokePlay(player: IPlayer): PlayerInput | undefined {
    takeFreeWare(player, 4);
    return undefined;
  }
}
