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
          // Two effects, each with the CHOAM sign (theme-extra.css): your own fee −1 (so 0), and 1 Solari when another
          // player closes a contract (Jens 22 Oct 2026)
          b.effect('Your CHOAM contracts cost you no fee: 0 instead of 1 M€.', (eb) => eb.text('CHOAM').startEffect.megacredits(-1)).br;
          b.effect('When another player closes a contract, gain 1 M€.', (eb) => eb.text('CHOAM').startEffect.megacredits(1));
        }),
      },
    });
  }
}
