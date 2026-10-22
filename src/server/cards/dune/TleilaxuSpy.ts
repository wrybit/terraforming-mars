import {IProjectCard} from '../IProjectCard';
import {Tag} from '../../../common/cards/Tag';
import {Card} from '../Card';
import {CardType} from '../../../common/cards/CardType';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';
import {Size} from '../../../common/cards/render/Size';
import {IPlayer} from '../../IPlayer';
import {PlayerInput} from '../../PlayerInput';
import {spyInput} from '../../dune/Schemes';

// Dune expansion, card E04 (mockup data/extension-cards.js)
export class TleilaxuSpy extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.EVENT,
      name: CardName.TLEILAXU_SPY,
      tags: [Tag.EARTH],
      // Seeing another House's agendas is strong: 13 (Jens, 21 Oct 2026; was 6)
      cost: 13,

      metadata: {
        cardNumber: 'E04',
        renderData: CardRenderer.builder((b) => {
          // Only looking, no Solari; the 2 agendas as a picture (theme-extra.css, Jens 22 Oct 2026)
          b.text('Look at all agendas of another player.', {size: Size.SMALL});
        }),
      },
    });
  }

  public override bespokePlay(player: IPlayer): PlayerInput | undefined {
    return spyInput(player);
  }
}
