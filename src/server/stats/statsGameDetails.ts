import {ViewModel} from '../../common/models/PlayerModel';
import {StatsFundedAward, StatsGameDetails, StatsGlobals, StatsTile} from '../../common/stats/StatsGame';
import {CITY_TILES, TileType} from '../../common/TileType';
import {Color} from '../../common/Color';
import {Expansion} from '../../common/cards/GameModule';
import {CardName} from '../../common/cards/CardName';
import {GlobalParameter} from '../../common/GlobalParameter';
import {MAX_OCEAN_TILES, MAX_OXYGEN_LEVEL, MAX_TEMPERATURE, MAX_VENUS_SCALE, MIN_TEMPERATURE} from '../../common/constants';

/** 1st and 2nd place of an award by score. */
function awardPlaces(scores: ReadonlyArray<{color: Color, score: number}>, nameByColor: Map<Color, string>): [Array<string>, Array<string>] {
  const values = Array.from(new Set(scores.map((score) => score.score))).sort((first, second) => second - first);
  const namesWith = (value: number | undefined) => scores
    .filter((score) => score.score === value)
    .map((score) => nameByColor.get(score.color))
    .filter((name): name is string => name !== undefined);
  const winners = namesWith(values[0]);
  // With a shared first place there is no second
  return [winners, winners.length > 1 ? [] : namesWith(values[1])];
}

const percent = (value: number | undefined, minimum: number, maximum: number) =>
  value === undefined ? undefined : Math.round((value - minimum) / (maximum - minimum) * 100);

/** Global parameters per generation in percent – same scale as the results page chart. */
function globals(view: ViewModel): StatsGlobals | undefined {
  const perGeneration = view.game.globalsPerGeneration;
  if (perGeneration.length === 0) {
    return undefined;
  }
  // If a value is missing, the previous generation's applies (the parameter didn't move)
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

/** Cities and greeneries with owner; other tiles (oceans, special tiles) are not shown by the heatmap. */
function tiles(view: ViewModel, nameByColor: Map<Color, string>): Array<StatsTile> {
  const result: Array<StatsTile> = [];
  for (const space of view.game.spaces) {
    const playerName = space.color === undefined ? undefined : nameByColor.get(space.color);
    if (playerName === undefined || space.tileType === undefined) {
      continue;
    }
    if (space.tileType === TileType.GREENERY) {
      result.push({spaceId: space.id, type: 'greenery', playerName});
    } else if (CITY_TILES.has(space.tileType)) {
      result.push({spaceId: space.id, type: 'city', playerName});
    }
  }
  return result;
}

/**
 * Reads the statistics data from the public final state (ViewModel).
 * Deliberately the ViewModel instead of game internals: own games and imported final states provide the same shape,
 * and the statistics stay unaffected by changes to the game engine.
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
    tiles: tiles(view, nameByColor),
  };
}
