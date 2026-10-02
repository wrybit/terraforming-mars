import {StatsGame, StatsGlobals} from '@/common/stats/StatsGame';
import {average, StatsPlayerResult} from './statsResults';

// Only a few long games reach late generations – an average of one or two values would be an outlier
const MIN_GAMES_PER_GENERATION = 3;

/** Mean per generation across several series of different lengths; only while enough games lasted that long. */
export function averageByGeneration(series: ReadonlyArray<ReadonlyArray<number>>, minimumGames: number = MIN_GAMES_PER_GENERATION): Array<number | undefined> {
  const result: Array<number | undefined> = [];
  for (let index = 0; ; index++) {
    const values = series.flatMap((entry) => index < entry.length ? [entry[index]] : []);
    if (values.length < Math.min(minimumGames, series.length) || values.length === 0) {
      return result;
    }
    result.push(average(values));
  }
}

/** Avg. victory points at the end of each generation, per player. */
export function averagePointsByGeneration(results: ReadonlyArray<StatsPlayerResult>, names: ReadonlyArray<string>): Array<{name: string, values: Array<number | undefined>}> {
  return names.map((name) => ({
    name,
    values: averageByGeneration(results
      .filter((result) => result.player.name === name)
      .flatMap((result) => result.details?.pointsByGeneration === undefined ? [] : [result.details.pointsByGeneration])),
  })).filter((entry) => entry.values.length > 0);
}

export const GLOBAL_PARAMETERS: ReadonlyArray<{key: keyof StatsGlobals, label: string, color: string}> = [
  {key: 'temperature', label: 'Temperature', color: 'red'},
  {key: 'oxygen', label: 'Oxygen', color: 'green'},
  {key: 'oceans', label: 'Oceans', color: 'blue'},
  {key: 'venus', label: 'Venus', color: 'yellow'},
];

/** Avg. progress of the global parameters in percent per generation. */
export function averageGlobalsByGeneration(games: ReadonlyArray<StatsGame>): Array<{key: keyof StatsGlobals, label: string, color: string, values: Array<number | undefined>}> {
  return GLOBAL_PARAMETERS.map((parameter) => ({
    ...parameter,
    values: averageByGeneration(games.flatMap((game) => {
      const values = game.details?.globalsByGeneration?.[parameter.key];
      return values === undefined ? [] : [values];
    })),
  })).filter((entry) => entry.values.length > 0);
}

/** Avg. victory points of a card when it was played. */
export function averageCardPoints(results: ReadonlyArray<StatsPlayerResult>, cardName: string): number | undefined {
  return average(results.flatMap((result) => (result.details?.cardPoints ?? [])
    .filter((card) => card.name === cardName)
    .map((card) => card.points)));
}
