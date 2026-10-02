import {StatsVictoryPoints} from '@/common/stats/StatsGame';
import {average, StatsPlayerResult} from './statsResults';

export type PointSource = Exclude<keyof StatsVictoryPoints, 'total'>;

/** Herkunft der Siegpunkte in der Reihenfolge der Ergebnisseite (Englisch, wird übersetzt). */
export const POINT_SOURCES: ReadonlyArray<{key: PointSource, label: string}> = [
  {key: 'terraformRating', label: 'Terraform rating'},
  {key: 'milestones', label: 'Milestones'},
  {key: 'awards', label: 'Awards'},
  {key: 'greenery', label: 'Greeneries'},
  {key: 'city', label: 'Cities'},
  {key: 'cards', label: 'Cards'},
  {key: 'other', label: 'Other'},
];

export type PointSourcesRow = {
  name: string;
  games: number;
  averages: Record<PointSource | 'total', number | undefined>;
};

/** Ø Siegpunkte je Herkunft, je Spieler – nur Partien mit Punkteaufschlüsselung. */
export function pointSourcesByPlayer(results: ReadonlyArray<StatsPlayerResult>): Array<PointSourcesRow> {
  const byPlayer = new Map<string, Array<StatsVictoryPoints>>();
  for (const result of results) {
    const points = result.details?.victoryPoints;
    if (points !== undefined) {
      byPlayer.set(result.player.name, [...(byPlayer.get(result.player.name) ?? []), points]);
    }
  }
  return Array.from(byPlayer.entries()).map(([name, list]) => {
    const averages = {} as PointSourcesRow['averages'];
    for (const key of [...POINT_SOURCES.map((source) => source.key), 'total' as const]) {
      averages[key] = average(list.map((points) => points[key]));
    }
    return {name, games: list.length, averages};
  });
}
