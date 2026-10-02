import {StatsGame, StatsGlobals} from '@/common/stats/StatsGame';
import {average, StatsPlayerResult} from './statsResults';

// Späte Generationen erreichen nur wenige lange Partien – ein Mittel aus ein, zwei Werten wäre ein Ausreißer
const MIN_GAMES_PER_GENERATION = 3;

/** Mittelwert je Generation über mehrere Verläufe unterschiedlicher Länge; nur solange genug Partien so lang waren. */
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

/** Ø Siegpunkte am Ende jeder Generation, je Spieler. */
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

/** Ø Fortschritt der globalen Parameter in Prozent je Generation. */
export function averageGlobalsByGeneration(games: ReadonlyArray<StatsGame>): Array<{key: keyof StatsGlobals, label: string, color: string, values: Array<number | undefined>}> {
  return GLOBAL_PARAMETERS.map((parameter) => ({
    ...parameter,
    values: averageByGeneration(games.flatMap((game) => {
      const values = game.details?.globalsByGeneration?.[parameter.key];
      return values === undefined ? [] : [values];
    })),
  })).filter((entry) => entry.values.length > 0);
}

/** Ø Siegpunkte einer Karte, wenn sie gespielt wurde. */
export function averageCardPoints(results: ReadonlyArray<StatsPlayerResult>, cardName: string): number | undefined {
  return average(results.flatMap((result) => (result.details?.cardPoints ?? [])
    .filter((card) => card.name === cardName)
    .map((card) => card.points)));
}
