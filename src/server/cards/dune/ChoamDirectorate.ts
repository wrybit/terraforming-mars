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
          // Only the own fee: −1, so 0 (CHOAM sign in theme-extra.css; Jens 22 Oct 2026: no payout for others' contracts)
          b.effect('Your CHOAM contracts cost you no fee: 0 instead of 1 M€.', (eb) => eb.text('CHOAM').startEffect.megacredits(-1));
        }),
      },
    });
  }
}
