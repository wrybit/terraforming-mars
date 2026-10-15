import {IPlayer} from '../IPlayer';
import {Payment, PaymentOptions, DEFAULT_PAYMENT_VALUES} from '../../common/inputs/Payment';
import {SPENDABLE_CARD_RESOURCES} from '../../common/inputs/Spendable';
import {IProjectCard} from '../cards/IProjectCard';
import {isIStandardProjectCard} from '../cards/IStandardProjectCard';
import {CardName} from '../../common/cards/CardName';

export type AllowedPaymentResources = Partial<PaymentOptions>;

/**
 * Builds a simple payment for `cost`. Order:
 * 1. Card resources that can only be spent as money (Kuiper asteroids, Dirigibles floaters,
 *    Psychrophiles microbes, …) – they have no other use, so spending them is free.
 * 2. Steel and titanium – worth more than 1 M€ and otherwise often wasted.
 * 3. M€, then heat.
 * If the cost is still not covered, overpay with one extra unit (card resource, steel, titanium).
 * The engine validates the result; an invalid payment makes the caller try another choice.
 */
export function greedyPayment(player: IPlayer, cost: number, allowed: AllowedPaymentResources, keep: Partial<Payment> = {}): Payment {
  let remaining = cost;
  const payment: Partial<Payment> = {};
  const spareUnits: Array<{key: keyof Payment, value: number}> = [];

  const spendUnits = (key: keyof Payment, available: number, value: number) => {
    const units = Math.min(available, Math.floor(remaining / value));
    payment[key] = (payment[key] ?? 0) + units;
    remaining -= units * value;
    if (available > units) {
      spareUnits.push({key, value});
    }
  };

  for (const key of SPENDABLE_CARD_RESOURCES) {
    if (allowed[key] === true) {
      spendUnits(key, player.getSpendable(key) - (keep[key] ?? 0), DEFAULT_PAYMENT_VALUES[key]);
    }
  }
  if (allowed.titanium === true) {
    spendUnits('titanium', player.titanium, player.getTitaniumValue());
  }
  if (allowed.steel === true) {
    spendUnits('steel', player.steel, player.getSteelValue());
  }
  spendUnits('megacredits', player.megaCredits, 1);
  if (allowed.heat === true || player.canUseHeatAsMegaCredits) {
    spendUnits('heat', player.heat, 1);
  }

  // Rest offen: eine Einheit mehr von der günstigsten Quelle überzahlen.
  const extra = remaining > 0 ? spareUnits.find((unit) => unit.key !== 'megacredits' && unit.key !== 'heat') : undefined;
  if (extra !== undefined) {
    payment[extra.key] = (payment[extra.key] ?? 0) + 1;
  }
  return Payment.of(payment);
}

/** The engine refuses these cards when they would use up the last resource they need themselves. */
const KEEP_FOR_CARD = new Map<CardName, Partial<Payment>>([
  [CardName.STRATOSPHERIC_BIRDS, {floaters: 1}],
  [CardName.SOIL_ENRICHMENT, {microbes: 1}],
]);

/** Payment for a project card or standard project, with every way to pay the engine accepts for it. */
export function cardPayment(player: IPlayer, card: IProjectCard, overriddenCost?: number): Payment {
  if (isIStandardProjectCard(card)) {
    return greedyPayment(player, overriddenCost ?? card.getAdjustedCost(player), {
      ...card.canPayWith(player),
      // Aurorai und Spire zahlen jedes Standardprojekt (wie StandardProjectCard.canPlayOptions).
      auroraiData: true,
      spireScience: true,
    });
  }
  const options = player.affordOptionsForCard(card);
  return greedyPayment(player, options.cost, options, KEEP_FOR_CARD.get(card.name));
}
