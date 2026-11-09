import {StatsGame, StatsGameDetails} from '../../common/stats/StatsGame';
import {PlayerAlias} from '../../common/admin/PlayerAliases';

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

/** Old name → shown name, per game: permanent merges everywhere, one-time merges only in their games. */
function renamerFor(aliases: ReadonlyArray<PlayerAlias>): (gameId: string) => (name: string) => string {
  const permanent = new Map(aliases.filter((alias) => alias.gameIds === undefined).map((alias) => [alias.from, alias.to]));
  const oneTimeByGame = new Map<string, Map<string, string>>();
  for (const alias of aliases) {
    for (const gameId of alias.gameIds ?? []) {
      const names = oneTimeByGame.get(gameId) ?? new Map<string, string>();
      names.set(alias.from, alias.to);
      oneTimeByGame.set(gameId, names);
    }
  }
  return (gameId) => {
    const oneTime = oneTimeByGame.get(gameId);
    return (name) => {
      const shown = permanent.get(name) ?? name;
      // A one-time merge names the player as the list showed it (after permanent merges); a later permanent
      // merge of the same name must not take these games away, hence the raw name as second key
      return oneTime?.get(shown) ?? oneTime?.get(name) ?? shown;
    };
  };
}

/** The games with merged names; without aliases the same games. */
export function applyPlayerAliases(games: ReadonlyArray<StatsGame>, aliases: ReadonlyArray<PlayerAlias>): Array<StatsGame> {
  if (aliases.length === 0) {
    return [...games];
  }
  const renamerOf = renamerFor(aliases);
  return games.map((game) => {
    const rename = renamerOf(game.summary.id);
    return {
      ...game,
      summary: {...game.summary, players: game.summary.players.map((player) => ({...player, name: rename(player.name)}))},
      details: game.details === undefined ? undefined : renamed(game.details, rename),
    };
  });
}
