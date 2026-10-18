import {expect} from 'chai';
import {testGame} from '../TestGame';
import {TestPlayer} from '../TestPlayer';
import {IGame} from '../../src/server/IGame';
import {Game} from '../../src/server/Game';
import {OrOptions} from '../../src/server/inputs/OrOptions';
import {TileType} from '../../src/common/TileType';
import {BoardName} from '../../src/common/boards/BoardName';
import {Space} from '../../src/server/boards/Space';
import {ARRAKIS_ZONES, BEHIND_WORM_BORDER} from '../../src/common/dune/arrakisTerrain';
import {WORM_START, WORM_TITLE, WormData, crossSpace, directionIndex, maxWormDistance, wormChooser, wormPath} from '../../src/server/dune/Worm';
import {cast} from '../../src/common/utils/utils';
import {finishGeneration, setOxygenLevel} from '../TestingUtils';

function wormOf(game: IGame): WormData {
  const worm = game.duneData?.worm;
  if (worm === undefined) {
    throw new Error('no worm');
  }
  return worm;
}

describe('Shai-Hulud (Dune module C)', () => {
  let game: IGame;
  let player1: TestPlayer;
  let player2: TestPlayer;

  beforeEach(() => {
    [game, player1, player2] = testGame(2, {theme: 'dune', boardName: BoardName.ARRAKIS, duneModules: ['worm']});
  });

  it('starts on E4 outside the worm border', () => {
    expect(wormOf(game).spaceId).eq(WORM_START);
    expect(BEHIND_WORM_BORDER).not.includes(WORM_START);
    expect(ARRAKIS_ZONES[WORM_START]).eq('erg');
  });

  it('maps the die clockwise from top right', () => {
    expect([1, 2, 3, 4, 5, 6].map(directionIndex)).deep.eq([1, 2, 3, 4, 5, 0]);
  });

  it('never enters rock or the polar sink and stops at the edge', () => {
    for (const space of game.board.spaces) {
      if (ARRAKIS_ZONES[space.id] === undefined) {
        continue;
      }
      for (let roll = 1; roll <= 6; roll++) {
        for (const crossed of wormPath(game.board, space.id, roll, 3)) {
          expect(ARRAKIS_ZONES[crossed.id]).not.eq('rock');
          expect(BEHIND_WORM_BORDER).not.includes(crossed.id);
        }
      }
    }
  });

  it('moves less on a greener Arrakis', () => {
    expect(maxWormDistance(game)).eq(3);
    setOxygenLevel(game, 8);
    expect(maxWormDistance(game)).eq(2);
    setOxygenLevel(game, game.max.oxygen);
    expect(maxWormDistance(game)).eq(1);
  });

  it('lets the player with the least TR choose, the later one on a tie', () => {
    expect(wormChooser(game)).eq(player2);
    player2.setTerraformRating(25);
    expect(wormChooser(game)).eq(player1);
  });

  it('blows spice next to a spice field, carries worm riders, tramples greeneries', () => {
    const ocean = game.board.getAvailableSpacesForOcean(player1)[0];
    game.addOcean(player1, ocean);
    const neighbours = game.board.getAdjacentSpaces(ocean).filter((space: Space) => game.board.getAvailableSpacesOnLand(player1).includes(space));
    game.addCity(player1, neighbours[0]);
    const titanium = player1.titanium;
    crossSpace(game, ocean);
    expect(player1.titanium).eq(titanium + 1);

    const city = neighbours[0];
    crossSpace(game, city);
    expect(player1.titanium).eq(titanium + 2);
    expect(player1.heat).eq(2);

    const greenery = game.board.getAvailableSpacesForGreenery(player2)[0];
    game.addGreenery(player2, greenery);
    player2.plants = 5;
    crossSpace(game, greenery);
    expect(player2.plants).eq(2);
    // Cannot pay 3 plants: resources worth 4 instead, cheapest first
    player2.plants = 1;
    player2.heat = 2;
    player2.megaCredits = 10;
    crossSpace(game, greenery);
    expect([player2.heat, player2.plants, player2.megaCredits]).deep.eq([0, 0, 9]);
  });

  it('takes the special tile levy in M€', () => {
    const space = game.board.getAvailableSpacesOnLand(player1)[0];
    game.simpleAddTile(player1, space, {tileType: TileType.COMMERCIAL_DISTRICT});
    player1.megaCredits = 10;
    crossSpace(game, space);
    expect(player1.megaCredits).eq(7);
  });

  it('moves at the end of the generation and blocks its space', () => {
    player1.setTerraformRating(30);
    finishGenerationWithWorm();
    const input = cast(player2.getWaitingFor(), OrOptions);
    expect(input.title).eq(WORM_TITLE);
    expect(input.options).has.length(3);
    const worm = wormOf(game);
    const expected = wormPath(game.board, worm.spaceId, worm.roll ?? 1, 3);
    input.process({type: 'or', index: 2, response: {type: 'option'}}, player2);
    player2.popWaitingFor();
    if (expected.length > 0) {
      const end = expected[expected.length - 1].id;
      expect(wormOf(game).spaceId).eq(end);
      expect(game.board.getAvailableSpacesOnLand(player1).map((space) => space.id)).not.includes(end);
      expect(game.board.getAvailableSpacesForOcean(player1).map((space) => space.id)).not.includes(end);
    }
  });

  it('asks again after a reload', () => {
    // Generation 1 without corporations reloads into the corporation choice (test games skip it)
    game.generation = 2;
    finishGenerationWithWorm();
    const chooser = wormOf(game).chooser;
    const restored = Game.deserialize(JSON.parse(JSON.stringify(game.serialize())));
    expect(restored.duneData?.worm?.chooser).eq(chooser);
    expect(cast(restored.getPlayerById(chooser as any).getWaitingFor(), OrOptions).title).eq(WORM_TITLE);
  });

  function finishGenerationWithWorm() {
    // finishGeneration expects the next generation at once; with the worm the game first waits for the chooser
    player1.popWaitingFor();
    player2.popWaitingFor();
    try {
      finishGeneration(game);
    } catch {
      // expected: generation not advanced yet
    }
    expect(wormOf(game).chooser).is.not.undefined;
  }
});
