import {StatsGame, StatsGameDetails} from '../../common/stats/StatsGame';

// Every place of a statistics game that holds a player name. New objects instead of changes: the finished
// games stay cached in collectStatsGames.ts and must keep their original names for a later unmerge.

function renamed(details: StatsGameDetails, rename: (name: string) => string): StatsGameDetails {
  return {
    ...details,
    players: details.players.map((player) => ({...player, name: rename(player.name)})),
    milestones: details.milestones.map((milestone) => ({...milestone, playerName: rename(milestone.playerName)})),
    awards: details.awards.map((award) => ({
      ...award,
      funderName: rename(award.funderName),
      winnerNames: award.winnerNames.map(rename),
      secondNames: award.secondNames?.map(rename),
    })),
    tiles: details.tiles?.map((tile) => ({...tile, playerName: rename(tile.playerName)})),
  };
}

/** The games with merged names (old name → shown name); without aliases the same games. */
export function applyPlayerAliases(games: ReadonlyArray<StatsGame>, targets: ReadonlyMap<string, string>): Array<StatsGame> {
  if (targets.size === 0) {
    return [...games];
  }
  const rename = (name: string) => targets.get(name) ?? name;
  return games.map((game) => ({
    ...game,
    summary: {...game.summary, players: game.summary.players.map((player) => ({...player, name: rename(player.name)}))},
    details: game.details === undefined ? undefined : renamed(game.details, rename),
  }));
}
