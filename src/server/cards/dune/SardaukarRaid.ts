import {IProjectCard} from '../IProjectCard';
import {Card} from '../Card';
import {CardType} from '../../../common/cards/CardType';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';
import {all} from '../Options';
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
      cost: 18,
      behavior: {
        stock: {megacredits: 4},
      },

      metadata: {
        cardNumber: 'E12',
        renderData: CardRenderer.builder((b) => {
          // Icons like the other cards that hit opponents (Jens 21 Oct 2026): −1 influence of the others with a red
          // outline, then the 4 Solari you gain; who is hit says the description in red (cardTextMarkup.ts)
          b.minus().tr(1, {all}).nbsp.megacredits(4);
        }),
        description: 'Every opponent with envy 3 or more loses 1 TR. Gain 4 M€.',
      },
    });
  }

  public override bespokePlay(player: IPlayer): PlayerInput | undefined {
    raid(player);
    return undefined;
  }
}
