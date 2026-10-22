import {IProjectCard} from '../IProjectCard';
import {Tag} from '../../../common/cards/Tag';
import {Card} from '../Card';
import {CardType} from '../../../common/cards/CardType';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';
import {IPlayer} from '../../IPlayer';
import {PlayerInput} from '../../PlayerInput';
import {PlaceGreeneryTile} from '../../deferredActions/PlaceGreeneryTile';

// Dune expansion, card E07 (mockup data/extension-cards.js): a greenery the worm spares (only this one)
export class DuneStabiliser extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.AUTOMATED,
      name: CardName.DUNE_STABILISER,
      tags: [Tag.PLANT],
      // Better than a greenery for 23 (the worm spares it): 20 (Jens 22 Oct 2026; was 13)
      cost: 20,
      requirements: {oxygen: 6},

      metadata: {
        cardNumber: 'E07',
        renderData: CardRenderer.builder((b) => {
          // A special tile: the greenery in the yellow border of the special tiles (theme-extra.css)
          b.greenery();
        }),
        description: 'Place a greenery tile. The worm spares this greenery.',
      },
    });
  }

  public override bespokeCanPlay(player: IPlayer): boolean {
    return player.game.board.getAvailableSpacesForGreenery(player).length > 0;
  }

  public override bespokePlay(player: IPlayer): PlayerInput | undefined {
    // Remember the space: the worm checks it when it crosses (server/dune/Worm.ts crossSpace)
    player.game.defer(new PlaceGreeneryTile(player).andThen((space) => {
      const worm = player.game.duneData?.worm;
      if (space !== undefined && worm !== undefined) {
        worm.spared = [...(worm.spared ?? []), space.id];
      }
    }));
    return undefined;
  }
}
