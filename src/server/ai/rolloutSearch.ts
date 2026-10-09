import {PlayerId} from '../../common/Types';
import {IPlayer} from '../IPlayer';
import {InputResponse} from '../../common/inputs/InputResponse';
import {OrOptions} from '../inputs/OrOptions';
import {Phase} from '../../common/Phase';
import {GameSnapshot, hideUnknownCards, isActionMenu, withCopy} from './gameCopy';
import {quickResponse} from './quickResponse';
import {randomResponse} from './randomResponse';
import {relativeValue, valuationContext} from './stateValue';
import {seededRandom} from './randomChoice';

// Rollouts: a move is judged by playing the rest of the generation on copies of the game, with a
// fast greedy AI for every player. The one-step lookahead only saw its own turn and the next
// opponent reply; races (milestones, awards, the last ocean), the order of passing and what is
// left for the final conversions only show up over several turns.
// Each rollout imagines new hidden cards for the opponents and a new draw pile: the AI knows
// only what a human at the table knows (gameCopy.ts hideUnknownCards).

/** Inputs answered in one rollout before it is given up (a generation has far fewer). */
const MAXIMUM_ROLLOUT_STEPS = 400;

/** Fast move choice for the action menu inside a rollout (undefined: answer with quick rules). */
export type RolloutPolicy = (menu: OrOptions, player: IPlayer) => InputResponse | undefined;

function answer(player: IPlayer, policy: RolloutPolicy): boolean {
  const input = player.getWaitingFor();
  if (input === undefined) {
    return false;
  }
  const chosen = isActionMenu(input) ? policy(input, player) : undefined;
  const attempts: Array<() => InputResponse> = [
    ...(chosen !== undefined ? [() => chosen] : []),
    () => quickResponse(input, player),
    () => randomResponse(input, player, Math.random),
    () => randomResponse(input, player, Math.random),
  ];
  for (const attempt of attempts) {
    try {
      player.process(attempt());
      return true;
    } catch {
      if (player.getWaitingFor() !== input) {
        return true; // answered after all
      }
    }
  }
  return false;
}

/**
 * Value for `playerId` after playing the copy to the end of the current generation (or the end
 * of the game). Undefined when the rollout got stuck or ran out of time.
 */
export function rolloutValue(snapshot: GameSnapshot, playerId: PlayerId, firstMove: InputResponse | undefined, policy: RolloutPolicy, deadline: number, seed: number): number | undefined {
  return withCopy(snapshot, (copy) => {
    // The same seed for every move of one round: all moves meet the same imagined hands and
    // draw pile (common random numbers), so the comparison is not drowned in card luck.
    hideUnknownCards(copy, playerId, seededRandom(seed));
    const player = copy.getPlayerById(playerId);
    if (firstMove !== undefined) {
      try {
        player.process(firstMove);
      } catch {
        return undefined;
      }
    }
    const generation = copy.generation;
    for (let step = 0; step < MAXIMUM_ROLLOUT_STEPS; step++) {
      if (copy.phase === Phase.END || copy.generation !== generation) {
        return relativeValue(player, valuationContext(copy, player));
      }
      if (performance.now() > deadline) {
        return undefined;
      }
      const waiting = copy.players.find((candidate) => candidate.getWaitingFor() !== undefined);
      if (waiting === undefined || !answer(waiting, policy)) {
        return undefined;
      }
    }
    return undefined;
  });
}

export type RolloutEntry = {snapshot: GameSnapshot, firstMove: InputResponse | undefined};

/**
 * Mean rollout value per entry over complete rounds (one rollout per entry with the same seed),
 * as many rounds as fit the time budget. Undefined with fewer than `minimumRounds`.
 */
export function rolloutMeans(entries: ReadonlyArray<RolloutEntry>, playerId: PlayerId, policy: RolloutPolicy, budgetMilliseconds: number, minimumRounds: number, maximumRounds: number): Array<number> | undefined {
  const deadline = performance.now() + budgetMilliseconds;
  const sums = entries.map(() => 0);
  let rounds = 0;
  for (let round = 0; round < maximumRounds && performance.now() < deadline; round++) {
    const seed = Math.floor(Math.random() * 4294967296);
    const values: Array<number> = [];
    for (const entry of entries) {
      const value = rolloutValue(entry.snapshot, playerId, entry.firstMove, policy, deadline, seed);
      if (value === undefined) {
        break;
      }
      values.push(value);
    }
    // An incomplete round would compare moves under different imagined cards: dropped.
    if (values.length === entries.length) {
      values.forEach((value, index) => sums[index] += value);
      rounds++;
    }
  }
  if (rounds < minimumRounds) {
    return undefined;
  }
  return sums.map((sum) => sum / rounds);
}
