import {IPlayer} from '../IPlayer';
import {IAward} from '../awards/IAward';
import {tuningOf} from './aiTuning';

// Awards that count a stock of resources (Miner: steel and titanium, Thermalist: heat …) can hardly
// be bought with money in the last actions: few cards hand out steel, titanium or heat. The money
// still open in the generation (stateValue.ts actionSwing) threatens them much less than awards for
// tiles or production. Human game: the AI kept 6 titanium to protect a Miner lead of 19 : 7 against
// an opponent with 49 M€ and did not play Space Elevator (2 VP) – the opponent ended at 7.
//
// Detected on the player itself, not from a list of award names: one more unit of a stock resource
// is added for a moment and the score compared.

type StockKey = 'steel' | 'titanium' | 'heat' | 'plants' | 'energy';
const STOCKS: ReadonlyArray<StockKey> = ['steel', 'titanium', 'heat', 'plants', 'energy'];

const stockAwards = new Map<string, boolean>();

/** True if the award's score rises with a resource stock (and not through tiles or production). */
export function isStockAward(award: IAward, player: IPlayer): boolean {
  const known = stockAwards.get(award.name);
  if (known !== undefined) {
    return known;
  }
  const before = award.getScore(player);
  let rises = false;
  for (const key of STOCKS) {
    player[key] += 1;
    try {
      rises = rises || award.getScore(player) > before;
    } finally {
      player[key] -= 1;
    }
  }
  stockAwards.set(award.name, rises);
  return rises;
}

/** Share of the money-driven award swing that applies to this award (aiTuning.ts stockAwardSwing). */
export function moneySwingShare(award: IAward, player: IPlayer): number {
  const share = tuningOf(player).stockAwardSwing;
  return share < 1 && isStockAward(award, player) ? share : 1;
}
