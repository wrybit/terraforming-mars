// Passing and other moves on the same footing. Rollouts play a pass on to the end of the generation (the opponents'
// remaining moves are seen), other moves mostly not; a move that is worse than doing nothing on its own could
// therefore beat passing (human games: 8 heat converted at maximum temperature 13 times; a paid award at 0 : 0 in
// generation 1). Earlier the pass penalty was dropped after rollouts and reviewAiDecisions.ts leaves passing out of
// its rollout comparison for the same reason – the two policies are not comparable. passFairness keeps the rollouts
// but lets no move whose own value is below the current position (worse than doing nothing) end up above passing.

type Entry<C> = {candidate: C, outcome: {value: number}};

/**
 * Lowers every non-pass move whose plain one-move value is below `nothingValue` (the position before the move) to
 * just under the pass value. No effect without a pass among the moves.
 */
export function capAgainstPass<C>(entries: ReadonlyArray<Entry<C>>, plainValues: ReadonlyMap<C, number>, nothingValue: number, isPass: (candidate: C) => boolean): void {
  const pass = entries.find((entry) => isPass(entry.candidate));
  if (pass === undefined) {
    return;
  }
  for (const entry of entries) {
    if (entry === pass) {
      continue;
    }
    const plain = plainValues.get(entry.candidate);
    if (plain !== undefined && plain < nothingValue && entry.outcome.value >= pass.outcome.value) {
      entry.outcome.value = pass.outcome.value - 0.01;
    }
  }
}
