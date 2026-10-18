import {IProjectCard} from '../IProjectCard';
import {Card} from '../Card';
import {CardType} from '../../../common/cards/CardType';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';
import {Size} from '../../../common/cards/render/Size';
import {IPlayer} from '../../IPlayer';
import {PlayerInput} from '../../PlayerInput';

// Dune expansion, card E05 (mockup data/extension-cards.js)
export class Thumper extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.EVENT,
      name: CardName.THUMPER,
      tags: [],
      cost: 3,

      metadata: {
        cardNumber: 'E05',
        renderData: CardRenderer.builder((b) => {
          b.text('This generation you choose how far the worm moves (1–3 spaces).', {size: Size.SMALL});
        }),
      },
    });
  }

  public override bespokePlay(player: IPlayer): PlayerInput | undefined {
    const worm = player.game.duneData?.worm;
    if (worm !== undefined) {
      worm.thumper = player.id;
    }
    return undefined;
  }
}
