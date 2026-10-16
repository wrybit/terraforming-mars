import {IPlayer} from '../IPlayer';
import {CardName} from '../../common/cards/CardName';
import {playCard} from './cardValue';
import {playerView, withCopy} from './gameCopy';
import {relativeValue, valuationContext} from './stateValue';
import {tuningOf} from './aiTuning';

// Corporation and preludes were valued one by one on an empty copy, so their interplay was missed: a prelude city
// brought Tharsis Republic no M€ production, prelude plants no greenery for Ecoline. Strong players pick preludes
// that fit the corporation. The opening is now also played together on one copy; the gain beyond the single
// values is the synergy (aiTuning.ts openingSynergy).

/** Value gain of putting the given cards into play together on a copy of the opening position. */
function jointGain(player: IPlayer, names: ReadonlyArray<CardName>): number | undefined {
  const context = valuationContext(player.game, player);
  return withCopy(playerView(player), (copy) => {
    const copyPlayer = copy.getPlayerById(player.id);
    copyPlayer.clearWaitingFor();
    try {
      const before = relativeValue(copyPlayer, context);
      for (const name of names) {
        playCard(copy, copyPlayer, name);
      }
      return relativeValue(copyPlayer, context) - before;
    } catch {
      return undefined;
    }
  });
}

/**
 * Synergy of a corporation with a prelude pair: value played together minus the values played alone.
 * 0 when off or when a copy cannot play the cards.
 */
export function openingSynergy(player: IPlayer, corporation: CardName, preludes: ReadonlyArray<CardName>): number {
  const weight = tuningOf(player).openingSynergy;
  if (weight <= 0 || preludes.length === 0) {
    return 0;
  }
  const together = jointGain(player, [corporation, ...preludes]);
  const alone = [corporation, ...preludes].map((name) => singleGain(player, name));
  if (together === undefined || alone.some((value) => value === undefined)) {
    return 0;
  }
  return weight * (together - alone.reduce((sum: number, value) => sum + (value ?? 0), 0));
}

// The single values repeat for every pair: cached per player and card for the opening decision.
const singleCache = new Map<string, number | undefined>();

function singleGain(player: IPlayer, name: CardName): number | undefined {
  const key = `${player.game.id}|${player.id}|${player.game.generation}|${name}`;
  if (!singleCache.has(key)) {
    if (singleCache.size > 200) {
      singleCache.clear();
    }
    singleCache.set(key, jointGain(player, [name]));
  }
  return singleCache.get(key);
}
