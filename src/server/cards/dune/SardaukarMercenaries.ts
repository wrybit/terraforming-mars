import {IProjectCard} from '../IProjectCard';
import {Card} from '../Card';
import {CardType} from '../../../common/cards/CardType';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';
import {CardResource} from '../../../common/CardResource';
import {IPlayer} from '../../IPlayer';
import {PlayerInput} from '../../PlayerInput';
import {addSardaukar} from '../../dune/Kanly';

// Dune expansion, card E13 (mockup data/extension-cards.js)
export class SardaukarMercenaries extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.EVENT,
      name: CardName.SARDAUKAR_MERCENARIES,
      tags: [],
      cost: 10,

      metadata: {
        cardNumber: 'E13',
        renderData: CardRenderer.builder((b) => {
          // 2 Sardaukar as icons (Jens 21 Oct 2026); the description says what they are for
          b.resource(CardResource.FIGHTER, 2);
        }),
        description: 'Gain 2 Sardaukar for the war field.',
      },
    });
  }

  public override bespokePlay(player: IPlayer): PlayerInput | undefined {
    addSardaukar(player, 2);
    return undefined;
  }
}
