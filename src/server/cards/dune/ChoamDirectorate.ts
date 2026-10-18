import {IProjectCard} from '../IProjectCard';
import {Tag} from '../../../common/cards/Tag';
import {Card} from '../Card';
import {CardType} from '../../../common/cards/CardType';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';

// Dune expansion, card E08 (mockup data/extension-cards.js)
export class ChoamDirectorate extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.ACTIVE,
      name: CardName.CHOAM_DIRECTORATE,
      tags: [Tag.EARTH],
      cost: 12,
      victoryPoints: 1,

      metadata: {
        cardNumber: 'E08',
        renderData: CardRenderer.builder((b) => {
          b.effect('Your CHOAM contracts cost no fee. When other players close a contract, gain 1 M€.', (eb) => eb.text('contract').startEffect.megacredits(1));
        }),
      },
    });
  }
}
