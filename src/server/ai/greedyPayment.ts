import {IPlayer} from '../../src/server/IPlayer';
import {Payment} from '../../src/common/inputs/Payment';

export type AllowedPaymentResources = {
  steel: boolean,
  titanium: boolean,
  heat: boolean,
};

/**
 * Builds a simple payment for `cost`: spend steel/titanium first (they are worth more than 1 M€
 * and are otherwise often wasted), then M€, then heat. If the cost is still not covered,
 * overpay with one extra unit of steel/titanium. The engine validates the result; an invalid
 * payment simply makes the caller try another random choice.
 */
export function greedyPayment(player: IPlayer, cost: number, allowed: AllowedPaymentResources): Payment {
  let remaining = cost;

  const titaniumValue = player.getTitaniumValue();
  const titanium = allowed.titanium ? Math.min(player.titanium, Math.floor(remaining / titaniumValue)) : 0;
  remaining -= titanium * titaniumValue;

  const steelValue = player.getSteelValue();
  const steel = allowed.steel ? Math.min(player.steel, Math.floor(remaining / steelValue)) : 0;
  remaining -= steel * steelValue;

  const megacredits = Math.min(player.megaCredits, remaining);
  remaining -= megacredits;

  const heat = allowed.heat ? Math.min(player.heat, remaining) : 0;
  remaining -= heat;

  let extraSteel = 0;
  let extraTitanium = 0;
  if (remaining > 0 && allowed.steel && player.steel > steel) {
    extraSteel = 1;
  } else if (remaining > 0 && allowed.titanium && player.titanium > titanium) {
    extraTitanium = 1;
  }

  return Payment.of({
    megacredits,
    steel: steel + extraSteel,
    titanium: titanium + extraTitanium,
    heat,
  });
}
