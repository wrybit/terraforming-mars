import {ViewModel} from '../../common/models/PlayerModel';
import {StatsFundedAward, StatsGameDetails} from '../../common/stats/StatsGame';
import {CITY_TILES, TileType} from '../../common/TileType';
import {Color} from '../../common/Color';
import {Expansion} from '../../common/cards/GameModule';

/**
 * Liest die Statistik-Angaben aus dem öffentlichen Endstand (ViewModel).
 * Bewusst das ViewModel statt der Spiel-Interna: dieselbe Form liefern eigene Partien und importierte Endstände,
 * und die Statistik bleibt von Änderungen an der Spiel-Engine unberührt.
 */
export function statsGameDetails(view: ViewModel): StatsGameDetails {
  const nameByColor = new Map<Color, string>(view.players.map((player) => [player.color, player.name]));
  const countTiles = (color: Color, matches: (tileType: TileType) => boolean) =>
    view.game.spaces.filter((space) => space.color === color && space.tileType !== undefined && matches(space.tileType)).length;

  const awards: Array<StatsFundedAward> = [];
  for (const award of view.game.awards) {
    if (award.playerName === undefined) {
      continue;
    }
    const best = Math.max(...award.scores.map((score) => score.score));
    awards.push({
      name: award.name,
      funderName: award.playerName,
      winnerNames: award.scores
        .filter((score) => score.score === best)
        .map((score) => nameByColor.get(score.color))
        .filter((name): name is string => name !== undefined),
    });
  }

  return {
    boardName: view.game.gameOptions.boardName,
    expansions: (Object.keys(view.game.gameOptions.expansions) as Array<Expansion>)
      .filter((expansion) => view.game.gameOptions.expansions[expansion]),
    players: view.players.map((player) => ({
      name: player.name,
      cards: player.tableau.map((card) => card.name),
      terraformRating: player.terraformRating,
      greeneries: countTiles(player.color, (tileType) => tileType === TileType.GREENERY),
      cities: countTiles(player.color, (tileType) => CITY_TILES.has(tileType)),
    })),
    milestones: view.game.milestones
      .filter((milestone) => milestone.playerName !== undefined)
      .map((milestone) => ({name: milestone.name, playerName: milestone.playerName as string})),
    awards,
  };
}
