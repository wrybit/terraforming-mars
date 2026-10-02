import {SegmentOption} from '@/client/components/create/createGameChoices';

// Mindestanzahl Partien für lange Listen: sonst stünden lauter einmal gespielte Einträge mit 100 % oben
export const MIN_PLAYS_OPTIONS: ReadonlyArray<SegmentOption> = [1, 2, 3, 5].map((value) => ({value, label: `${value}×`}));
const DEFAULT_MIN_PLAYS = 3;
// Nur so streng, dass noch genug Einträge übrig bleiben (Präludien gibt es z. B. nur aus wenigen Partien)
const MIN_VISIBLE_ROWS = 10;

/** Höchste Mindestanzahl (bis 3×), bei der noch MIN_VISIBLE_ROWS Einträge sichtbar bleiben. */
export function chooseMinPlays(plays: ReadonlyArray<number>): number {
  return [DEFAULT_MIN_PLAYS, 2, 1].find((minimum) => plays.filter((count) => count >= minimum).length >= MIN_VISIBLE_ROWS) ?? 1;
}
