import {StatsGame, StatsPlayerDetails} from '@/common/stats/StatsGame';
import {AdminPlayerSummary} from '@/common/admin/AdminGameSummary';
import {Color} from '@/common/Color';

/** Ein Spieler in einer Partie – die Einheit, über die fast alle Kennzahlen gezählt werden. */
export type StatsPlayerResult = {
  game: StatsGame;
  player: AdminPlayerSummary;
  /** 1 = Sieger; bei Gleichstand teilen sich Spieler den Platz. */
  place: number;
  details: StatsPlayerDetails | undefined;
};

/** Platzierung wie im Spiel: Siegpunkte, bei Gleichstand M€. */
function placeOf(player: AdminPlayerSummary, players: ReadonlyArray<AdminPlayerSummary>): number {
  if (player.isWinner) {
    return 1;
  }
  const ahead = players.filter((other) => other.victoryPoints > player.victoryPoints ||
    (other.victoryPoints === player.victoryPoints && other.megaCredits > player.megaCredits));
  return ahead.length + 1;
}

export function playerResults(game: StatsGame): Array<StatsPlayerResult> {
  return game.summary.players.map((player) => ({
    game,
    player,
    place: placeOf(player, game.summary.players),
    details: game.details?.players.find((details) => details.name === player.name),
  }));
}

export function allPlayerResults(games: ReadonlyArray<StatsGame>): Array<StatsPlayerResult> {
  return games.flatMap(playerResults);
}

/** Gleiche Schreibweise wie die Siegerstatistik der Admin-Übersicht (winCounts.ts), damit beide zusammenpassen. */
export function lineupOf(game: StatsGame): string {
  return Array.from(new Set(game.summary.players.map((player) => player.name)))
    .sort((first, second) => first.localeCompare(second))
    .join(' vs ');
}

export function yearOf(game: StatsGame): string {
  return String(new Date(game.summary.createdTimeMs).getFullYear());
}

/** Wahrscheinlichkeit zu gewinnen, wenn alle gleich gut wären. */
export function expectedWinRate(game: StatsGame): number {
  return 1 / Math.max(1, game.summary.players.length);
}

export function winnerOf(game: StatsGame): AdminPlayerSummary | undefined {
  return game.summary.players.find((player) => player.isWinner);
}

/** Spielernamen, die meistbeteiligten zuerst. */
export function playerNames(games: ReadonlyArray<StatsGame>): Array<string> {
  const counts = new Map<string, number>();
  for (const result of allPlayerResults(games)) {
    counts.set(result.player.name, (counts.get(result.player.name) ?? 0) + 1);
  }
  return Array.from(counts.keys()).sort((first, second) => (counts.get(second) ?? 0) - (counts.get(first) ?? 0) || first.localeCompare(second));
}

/** Farbe, in der ein Spieler meistens gespielt hat – so erkennt man ihn überall in der Statistik wieder. */
export function playerColors(games: ReadonlyArray<StatsGame>): Map<string, Color> {
  const counts = new Map<string, Map<Color, number>>();
  for (const {player} of allPlayerResults(games)) {
    const byColor = counts.get(player.name) ?? new Map<Color, number>();
    byColor.set(player.color, (byColor.get(player.color) ?? 0) + 1);
    counts.set(player.name, byColor);
  }
  const colors = new Map<string, Color>();
  counts.forEach((byColor, name) => {
    const [color] = Array.from(byColor.entries()).sort((first, second) => second[1] - first[1])[0];
    colors.set(name, color);
  });
  return colors;
}

export function average(values: ReadonlyArray<number>): number | undefined {
  return values.length === 0 ? undefined : values.reduce((sum, value) => sum + value, 0) / values.length;
}
