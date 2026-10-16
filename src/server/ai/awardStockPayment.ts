import {IPlayer} from '../IPlayer';
import {Payment} from '../../common/inputs/Payment';
import {isStockAward} from './stockAward';
import {lastGenerationLikelihood} from './gameProgress';
import {tuningOf} from './aiTuning';

// Human game: in the last generation the AI paid two cards with steel and lost the funded Miner award
// 9 : 10 – and the game 103 : 105. Paying with M€ would have kept the steel and won it.
// The payment is built greedily (greedyPayment.ts), so the look-ahead never sees this choice.
// Rule: in the likely last generation, steel and titanium stay unspent where spending them would cost a
// lead in a funded award that counts them, as long as M€ covers the cost (greedyPayment falls back otherwise).

/** Steel and titanium to keep back from a payment because a close stock award depends on them. */
export function stockToKeepForAwards(player: IPlayer): Partial<Payment> {
  const game = player.game;
  if (tuningOf(player).keepAwardStock <= 0 || lastGenerationLikelihood(game) < 0.75) {
    return {};
  }
  const keep: Partial<Payment> = {};
  for (const {award} of game.fundedAwards) {
    if (!isStockAward(award, player)) {
      continue;
    }
    const own = award.getScore(player);
    const best = Math.max(0, ...player.opponents.map((opponent) => award.getScore(opponent)));
    const stock = steelAndTitaniumIn(award, player);
    // Rounds 86–87: keeping the whole stock whenever the race was close cost −0.6 VP – the M€ was missing for
    // other cards. Now only a lead is protected, and only the units that would lose it; behind, nothing is kept.
    if (own < best || stock.steel + stock.titanium === 0) {
      continue;
    }
    const spendable = Math.max(0, own - best - 1);
    const keepUnits = Math.max(0, stock.steel + stock.titanium - spendable);
    // Titan zuerst ausgeben lassen (mehr M€ wert je Einheit), Stahl zurückhalten
    const keepSteel = Math.min(stock.steel, keepUnits);
    keep.steel = Math.max(keep.steel ?? 0, keepSteel);
    keep.titanium = Math.max(keep.titanium ?? 0, keepUnits - keepSteel);
  }
  return keep;
}

/** How much of the player's steel and titanium the award counts (probed like stockAward.ts). */
function steelAndTitaniumIn(award: Parameters<typeof isStockAward>[0], player: IPlayer): {steel: number, titanium: number} {
  const counts = (key: 'steel' | 'titanium') => {
    const before = award.getScore(player);
    player[key] += 1;
    try {
      return award.getScore(player) > before ? player[key] - 1 : 0;
    } finally {
      player[key] -= 1;
    }
  };
  return {steel: counts('steel'), titanium: counts('titanium')};
}
