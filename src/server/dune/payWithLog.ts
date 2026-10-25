import {IPlayer} from '../IPlayer';
import {Payment} from '../../common/inputs/Payment';
import {Resource} from '../../common/Resource';

// Payments of the Dune modules (tribute, bazaar ware) as log lines: player.pay() logs nothing for M€, steel, titanium
// and plants, so the log row of the move would show no cost on its right (logActions.ts; Jens 25 Oct 2026).
// Heat (Helion) and card resources keep the way player.pay() handles them.
const STOCK_PARTS: ReadonlyArray<[keyof Payment, Resource]> = [
  ['megacredits', Resource.MEGACREDITS],
  ['steel', Resource.STEEL],
  ['titanium', Resource.TITANIUM],
  ['plants', Resource.PLANTS],
];

export function payWithLog(player: IPlayer, payment: Payment): void {
  for (const [field, resource] of STOCK_PARTS) {
    const amount = payment[field];
    if (amount > 0) {
      player.stock.deduct(resource, amount, {log: true});
    }
  }
  player.pay({...payment, megacredits: 0, steel: 0, titanium: 0, plants: 0});
}
