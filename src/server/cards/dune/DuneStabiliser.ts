import {IProjectCard} from '../IProjectCard';
import {Tag} from '../../../common/cards/Tag';
import {Card} from '../Card';
import {CardType} from '../../../common/cards/CardType';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';
import {Size} from '../../../common/cards/render/Size';
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
      cost: 13,
      requirements: {oxygen: 6},

      metadata: {
        cardNumber: 'E07',
        renderData: CardRenderer.builder((b) => {
          b.greenery().br;
          b.text('The worm spares this greenery.', {size: Size.SMALL});
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
