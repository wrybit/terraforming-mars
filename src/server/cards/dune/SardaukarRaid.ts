import {IProjectCard} from '../IProjectCard';
import {Card} from '../Card';
import {CardType} from '../../../common/cards/CardType';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';
import {IPlayer} from '../../IPlayer';
import {PlayerInput} from '../../PlayerInput';
import {raid} from '../../dune/Smuggling';
import {COSTLY_SUSPICION} from '../../../common/dune/DuneModel';

// Dune expansion, card E12 (mockup data/extension-cards.js)
export class SardaukarRaid extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.EVENT,
      name: CardName.SARDAUKAR_RAID,
      tags: [],
      cost: 13,

      metadata: {
        cardNumber: 'E12',
        renderData: CardRenderer.builder((b) => {
          // The envy track with a red bracket under the steps that are hit, leading to the lost influence (canvas
          // RazziaVarianten B2, Jens 25 Oct 2026); the text leads the card, above the track
          b.envyTrack(COSTLY_SUSPICION, 1);
        }),
        description: {
          text: 'Every opponent who has envy 3 or more right now loses 1 TR immediately.',
          align: 'center',
          lead: true,
        },
      },
    });
  }

  public override bespokePlay(player: IPlayer): PlayerInput | undefined {
    raid(player);
    return undefined;
  }
}
