import {IProjectCard} from '../IProjectCard';
import {Tag} from '../../../common/cards/Tag';
import {Card} from '../Card';
import {CardType} from '../../../common/cards/CardType';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';
import {Size} from '../../../common/cards/render/Size';
import {IPlayer} from '../../IPlayer';
import {PlayerInput} from '../../PlayerInput';
import {takeCheapestWare} from '../../dune/Bazaar';

// Dune expansion, card E02 (mockup data/extension-cards.js)
export class CaravanMaster extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.AUTOMATED,
      name: CardName.CARAVAN_MASTER,
      tags: [Tag.EARTH],
      // A ware (about 20, −6) and 2 Solari production: 19 (Jens 22 Oct 2026; was 14)
      cost: 19,
      behavior: {
        production: {megacredits: 2},
      },

      metadata: {
        cardNumber: 'E02',
        renderData: CardRenderer.builder((b) => {
          b.production((pb) => pb.megacredits(2)).br;
          b.text('Take the cheapest ware on display at the bazaar for free.', {size: Size.SMALL});
        }),
        description: 'Increase your M€ production 2 steps. Take the cheapest ware on display at the bazaar for free.',
      },
    });
  }

  public override bespokePlay(player: IPlayer): PlayerInput | undefined {
    // The −6 slot was often empty with few players (Jens 22 Oct 2026)
    takeCheapestWare(player);
    return undefined;
  }
}
