import {ReplayGeneration} from './replaySteps';

// Victory points of one player at every replay step, TR included. The game records points only at the end of each
// generation (victoryPointsByGeneration). TR is known at every step, so the points are TR plus the rest (cards,
// tiles, milestones, awards) of the last finished generation – the TR part moves live, the rest jumps at generation
// ends. The last step shows the final total.
export function replayVictoryPoints(
  terraformRatings: ReadonlyArray<number>,
  generations: ReadonlyArray<ReplayGeneration>,
  pointsByGeneration: ReadonlyArray<number>,
  finalTotal: number,
): Array<number> {
  // Rest of the points (without TR) at the end of each generation, by generation number
  const rest = new Map<number, number>();
  generations.forEach((generation) => {
    const recorded = pointsByGeneration[generation.number - 1];
    const rating = terraformRatings[generation.start + generation.count - 1];
    if (recorded !== undefined && rating !== undefined) {
      rest.set(generation.number, recorded - rating);
    }
  });
  const points = terraformRatings.map((rating, step) => {
    const generation = generations.find((candidate) => step >= candidate.start && step < candidate.start + candidate.count);
    return rating + (generation === undefined ? 0 : rest.get(generation.number - 1) ?? 0);
  });
  if (points.length > 0) {
    points[points.length - 1] = finalTotal;
  }
  return points;
}
