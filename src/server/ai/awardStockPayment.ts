import {IPlayer} from '../IPlayer';
import {Payment} from '../../common/inputs/Payment';
import {isStockAward} from './stockAward';
import {lastGenerationLikelihood} from './gameProgress';
import {tuningOf} from './aiTuning';

// Human game: in the last generation the AI paid two cards with steel and lost the funded Miner award
// 9 : 10 – and the game 103 : 105. Paying with M€ would have kept the steel and won it.
// The payment is built greedily (greedyPayment.ts), so the look-ahead never sees this choice.
// Rule: in the likely last generation, steel and titanium stay unspent while they decide a funded
// award that counts them, as long as M€ covers the cost (greedyPayment falls back to them otherwise).

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
    // Close race only: spending the whole stock would not change a clear lead or a clear deficit
    const stock = steelAndTitaniumIn(award, player);
    if (stock.steel + stock.titanium === 0 || Math.abs(own - best) > stock.steel + stock.titanium) {
      continue;
    }
    keep.steel = Math.max(keep.steel ?? 0, stock.steel);
    keep.titanium = Math.max(keep.titanium ?? 0, stock.titanium);
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
