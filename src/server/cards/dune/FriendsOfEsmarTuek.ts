import {IProjectCard} from '../IProjectCard';
import {Tag} from '../../../common/cards/Tag';
import {Card} from '../Card';
import {CardType} from '../../../common/cards/CardType';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';
import {Size} from '../../../common/cards/render/Size';
import {IPlayer} from '../../IPlayer';
import {PlayerInput} from '../../PlayerInput';
import {lowerSuspicion} from '../../dune/Smuggling';

// Dune expansion, card E11 (mockup data/extension-cards.js)
export class FriendsOfEsmarTuek extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.AUTOMATED,
      name: CardName.FRIENDS_OF_ESMAR_TUEK,
      tags: [Tag.EARTH],
      // Two bribes (2 × 10) and 3 spice: 23 (Jens 22 Oct 2026; was 7)
      cost: 23,
      behavior: {
        stock: {titanium: 3},
      },

      metadata: {
        cardNumber: 'E11',
        renderData: CardRenderer.builder((b) => {
          b.text('Lower your envy 2 steps.', {size: Size.SMALL}).br;
          b.titanium(3);
        }),
        description: 'Lower your envy by 2. Gain 3 titanium.',
      },
    });
  }

  public override bespokePlay(player: IPlayer): PlayerInput | undefined {
    lowerSuspicion(player, 2);
    return undefined;
  }
}
