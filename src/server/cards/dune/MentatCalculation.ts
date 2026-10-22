import {IProjectCard} from '../IProjectCard';
import {Tag} from '../../../common/cards/Tag';
import {Card} from '../Card';
import {CardType} from '../../../common/cards/CardType';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';
import {Size} from '../../../common/cards/render/Size';
import {IPlayer} from '../../IPlayer';
import {PlayerInput} from '../../PlayerInput';
import {mentatInput} from '../../dune/Schemes';

// Dune expansion, card E03 (mockup data/extension-cards.js)
export class MentatCalculation extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.EVENT,
      name: CardName.MENTAT_CALCULATION,
      tags: [Tag.SCIENCE],
      // Up to about 7 VP for a better agenda: 15, from 30 influence (Jens 22 Oct 2026; was 4)
      cost: 15,
      requirements: {tr: 30},

      metadata: {
        cardNumber: 'E03',
        renderData: CardRenderer.builder((b) => {
          b.text('Look at the top 3 agendas. You may swap one of yours for one of them.', {size: Size.SMALL});
        }),
      },
    });
  }

  public override bespokePlay(player: IPlayer): PlayerInput | undefined {
    return mentatInput(player);
  }
}
