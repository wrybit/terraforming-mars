import {ViewModel} from '../../common/models/PlayerModel';
import {StatsFundedAward, StatsGameDetails, StatsGlobals} from '../../common/stats/StatsGame';
import {CITY_TILES, TileType} from '../../common/TileType';
import {Color} from '../../common/Color';
import {Expansion} from '../../common/cards/GameModule';
import {CardName} from '../../common/cards/CardName';
import {GlobalParameter} from '../../common/GlobalParameter';
import {MAX_OCEAN_TILES, MAX_OXYGEN_LEVEL, MAX_TEMPERATURE, MAX_VENUS_SCALE, MIN_TEMPERATURE} from '../../common/constants';

/** Plätze 1 und 2 einer Auszeichnung nach Punktestand. */
function awardPlaces(scores: ReadonlyArray<{color: Color, score: number}>, nameByColor: Map<Color, string>): [Array<string>, Array<string>] {
  const values = Array.from(new Set(scores.map((score) => score.score))).sort((first, second) => second - first);
  const namesWith = (value: number | undefined) => scores
    .filter((score) => score.score === value)
    .map((score) => nameByColor.get(score.color))
    .filter((name): name is string => name !== undefined);
  const winners = namesWith(values[0]);
  // Bei geteiltem ersten Platz gibt es keinen zweiten
  return [winners, winners.length > 1 ? [] : namesWith(values[1])];
}

const percent = (value: number | undefined, minimum: number, maximum: number) =>
  value === undefined ? undefined : Math.round((value - minimum) / (maximum - minimum) * 100);

/** Globale Parameter je Generation in Prozent – gleiche Skala wie das Diagramm der Ergebnisseite. */
function globals(view: ViewModel): StatsGlobals | undefined {
  const perGeneration = view.game.globalsPerGeneration;
  if (perGeneration.length === 0) {
    return undefined;
  }
  // Fehlt ein Wert, gilt der der Vorgeneration (der Parameter hat sich nicht bewegt)
  const series = (parameter: GlobalParameter, minimum: number, maximum: number): Array<number> => {
    let last = 0;
    return perGeneration.map((values) => last = percent(values[parameter], minimum, maximum) ?? last);
  };
  const result: StatsGlobals = {
    temperature: series(GlobalParameter.TEMPERATURE, MIN_TEMPERATURE, MAX_TEMPERATURE),
    oxygen: series(GlobalParameter.OXYGEN, 0, MAX_OXYGEN_LEVEL),
    oceans: series(GlobalParameter.OCEANS, 0, MAX_OCEAN_TILES),
  };
  if (view.game.gameOptions.expansions.venus) {
    result.venus = series(GlobalParameter.VENUS, 0, MAX_VENUS_SCALE);
  }
  return result;
}

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
    const [winnerNames, secondNames] = awardPlaces(award.scores, nameByColor);
    awards.push({name: award.name, funderName: award.playerName, winnerNames, secondNames});
  }

  return {
    source: 'game',
    cardsComplete: true,
    boardName: view.game.gameOptions.boardName,
    expansions: (Object.keys(view.game.gameOptions.expansions) as Array<Expansion>)
      .filter((expansion) => view.game.gameOptions.expansions[expansion]),
    players: view.players.map((player) => {
      const breakdown = player.victoryPointsBreakdown;
      return {
        name: player.name,
        cards: player.tableau.map((card) => card.name),
        cardPoints: breakdown.detailsCards.map((card) => ({name: card.cardName as CardName, points: card.victoryPoint})),
        terraformRating: player.terraformRating,
        greeneries: countTiles(player.color, (tileType) => tileType === TileType.GREENERY),
        cities: countTiles(player.color, (tileType) => CITY_TILES.has(tileType)),
        victoryPoints: {
          terraformRating: breakdown.terraformRating,
          milestones: breakdown.milestones,
          awards: breakdown.awards,
          greenery: breakdown.greenery,
          city: breakdown.city,
          cards: breakdown.victoryPoints,
          other: breakdown.total - breakdown.terraformRating - breakdown.milestones - breakdown.awards - breakdown.greenery - breakdown.city - breakdown.victoryPoints,
          total: breakdown.total,
        },
        pointsByGeneration: [...player.victoryPointsByGeneration],
        megaCredits: player.megacredits,
        timeSeconds: Math.round(player.timer.sumElapsed / 1000),
        actions: player.actionsTakenThisGame,
      };
    }),
    milestones: view.game.milestones
      .filter((milestone) => milestone.playerName !== undefined)
      .map((milestone) => ({name: milestone.name, playerName: milestone.playerName as string})),
    awards,
    globalsByGeneration: globals(view),
  };
}
