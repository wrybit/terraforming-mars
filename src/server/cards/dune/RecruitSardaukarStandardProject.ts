import {IPlayer} from '../../IPlayer';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';
import {StandardProjectCard} from '../StandardProjectCard';
import {addSardaukar, SARDAUKAR_PRICES} from '../../dune/Kanly';
import {Resource} from '../../../common/Resource';

/** Price in M€ of one Sardaukar (dune/Kanly.ts) */
const MEGACREDIT_PRICE = SARDAUKAR_PRICES.find(([resource]) => resource === Resource.MEGACREDITS)?.[1] ?? 12;

// Dune expansion, module F (Kanly): recruiting a Sardaukar as a standard project, so it is found where the other
// standard projects are (Jens, 19 Oct 2026). Paying with other goods stays in the Dune actions (dune/Kanly.ts).
export class RecruitSardaukarStandardProject extends StandardProjectCard {
  constructor() {
    super({
      name: CardName.RECRUIT_SARDAUKAR_STANDARD_PROJECT,
      cost: MEGACREDIT_PRICE,
      metadata: {
        cardNumber: 'SP-K',
        renderData: CardRenderer.builder((b) =>
          b.standardProject(`Spend ${MEGACREDIT_PRICE} Solari to recruit 1 Sardaukar for the war field.`, (eb) => {
            eb.megacredits(MEGACREDIT_PRICE).startAction.text('1 Sardaukar');
          }),
        ),
      },
    });
  }

  public override canAct(player: IPlayer): boolean {
    return player.game.duneData?.kanly !== undefined && super.canAct(player);
  }

  actionEssence(player: IPlayer): void {
    addSardaukar(player, 1);
  }
}
