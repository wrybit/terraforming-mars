import {IProjectCard} from '../IProjectCard';
import {Card} from '../Card';
import {CardType} from '../../../common/cards/CardType';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';
import {Size} from '../../../common/cards/render/Size';
import {IPlayer} from '../../IPlayer';
import {PlayerInput} from '../../PlayerInput';
import {raid} from '../../dune/Smuggling';

// Dune expansion, card E12 (mockup data/extension-cards.js)
export class SardaukarRaid extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.EVENT,
      name: CardName.SARDAUKAR_RAID,
      tags: [],
      cost: 5,
      behavior: {
        stock: {megacredits: 4},
      },

      metadata: {
        cardNumber: 'E12',
        renderData: CardRenderer.builder((b) => {
          b.text('Opponents with suspicion 3 or more lose 1 TR.', {size: Size.SMALL}).br;
          b.megacredits(4);
        }),
        description: 'Every opponent with suspicion 3 or more loses 1 TR. Gain 4 M€.',
      },
    });
  }

  public override bespokePlay(player: IPlayer): PlayerInput | undefined {
    raid(player);
    return undefined;
  }
}
