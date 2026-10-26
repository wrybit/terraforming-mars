import {IPlayer} from '../IPlayer';
import {Resource} from '../../common/Resource';
import {isStockAward} from '../ai/stockAward';

// Water (heat) at maximum temperature is worth nothing to burn: the AI converted it 13 times in a human game instead
// of passing. At the guild it can be sold. The AI keeps what a funded stock award it leads still needs (the same
// rule as keepAwardStock for steel and titanium: only the units that would lose the lead stay).

/** Water units the player keeps for funded stock awards it leads (score lead must survive the sale). */
export function waterToKeepForAwards(player: IPlayer): number {
  let keep = 0;
  for (const {award} of player.game.fundedAwards) {
    if (!isStockAward(award, player)) {
      continue;
    }
    const best = Math.max(0, ...player.opponents.map((opponent) => award.getScore(opponent)));
    if (award.getScore(player) <= best) {
      continue;
    }
    // Remove water one unit at a time until the lead would be gone: the units before that may go.
    const heat = player.heat;
    let sellable = 0;
    try {
      while (sellable < heat) {
        player.heat = heat - sellable - 1;
        if (award.getScore(player) <= best) {
          break;
        }
        sellable++;
      }
    } finally {
      player.heat = heat;
    }
    keep = Math.max(keep, heat - sellable);
  }
  return keep;
}

/** Water the AI may sell at the guild: all of it at maximum temperature, minus what funded award leads need. */
export function sellableWater(player: IPlayer): number {
  const game = player.game;
  if (game.getTemperature() < game.max.temperature) {
    return 0;
  }
  return Math.max(0, player.stock.get(Resource.HEAT) - waterToKeepForAwards(player));
}
