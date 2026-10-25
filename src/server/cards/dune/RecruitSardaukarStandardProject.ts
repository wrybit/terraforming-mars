import {IPlayer} from '../../IPlayer';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';
import {StandardProjectCard} from '../StandardProjectCard';
import {addSardaukar, SARDAUKAR_PRICE} from '../../dune/Kanly';
import {CardResource} from '../../../common/CardResource';
import {Payment} from '../../../common/inputs/Payment';
import {payWithLog} from '../../dune/payWithLog';

/** Price in M€ of one Sardaukar (dune/Kanly.ts) */
const MEGACREDIT_PRICE = SARDAUKAR_PRICE;

// Dune expansion, module F (Kanly): recruiting a Sardaukar as a standard project, so it is found where the other
// standard projects are (Jens, 19 Oct 2026). The only way to recruit, for human and AI players alike (Jens, 25 Oct 2026).
export class RecruitSardaukarStandardProject extends StandardProjectCard {
  constructor() {
    super({
      name: CardName.RECRUIT_SARDAUKAR_STANDARD_PROJECT,
      cost: MEGACREDIT_PRICE,
      metadata: {
        cardNumber: 'SP-K',
        renderData: CardRenderer.builder((b) =>
          b.standardProject(`Spend ${MEGACREDIT_PRICE} Solari to recruit 1 Sardaukar for the war field.`, (eb) => {
            // Sardaukar icon like the goods of the other standard projects (Dune theme: fighter → Sardaukar)
            eb.megacredits(MEGACREDIT_PRICE).startAction.resource(CardResource.FIGHTER);
          }),
        ),
      },
    });
  }

  public override canAct(player: IPlayer): boolean {
    return player.game.duneData?.kanly !== undefined && super.canAct(player);
  }

  /** The row of the standard project first, then its price and the Sardaukar on its right in the log (Jens 25 Oct 2026) */
  public override payAndExecute(player: IPlayer, payment: Payment): void {
    this.projectPlayed(player);
    payWithLog(player, payment);
    this.actionEssence(player);
  }

  actionEssence(player: IPlayer): void {
    addSardaukar(player, 1);
  }
}
