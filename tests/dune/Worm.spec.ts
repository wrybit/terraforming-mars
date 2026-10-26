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
import {WORM_START, WORM_START_SPACES, WORM_TITLE, WormData, bouncedDirection, crossSpace, rollWorm, wormLine, directionIndex, distanceInput, maxWormDistance, moveWorm, wormChoices, wormChooser, wormDirection, wormModel, wormPath} from '../../src/server/dune/Worm';
import {LEVY_TITLE, PendingLevy, levyInput} from '../../src/server/dune/WormLevy';
import {SelectOption} from '../../src/server/inputs/SelectOption';
import {formatMessage} from '../TestingUtils';
import {cast} from '../../src/common/utils/utils';
import {arrakisCoordinate} from '../../src/common/dune/arrakisCoordinates';
import {ARRAKIS_91_LAYOUT, ARRAKIS_LAYOUT} from '../../src/common/dune/arrakisLayout';
import {finishGeneration, setOxygenLevel} from '../TestingUtils';

function wormOf(game: IGame): WormData {
  const worm = game.duneData?.worm;
  if (worm === undefined) {
    throw new Error('no worm');
  }
  return worm;
}
import {wormDistanceSections} from '../../src/common/dune/wormDistance';
import {Arrakis61Board} from '../../src/server/boards/Arrakis61Board';

describe('Shai-Hulud (Dune module C)', () => {
  let game: IGame;
  let player1: TestPlayer;
  let player2: TestPlayer;

  beforeEach(() => {
    [game, player1, player2] = testGame(2, {theme: 'dune', boardName: BoardName.ARRAKIS_61, duneModules: ['worm']});
  });

  it('starts on one of the southern spaces E5, F4, F5, G3, G4, H3, H4, picked at random', () => {
    expect(WORM_START_SPACES.map((id) => arrakisCoordinate(ARRAKIS_LAYOUT, id))).deep.eq(['E5', 'F4', 'F5', 'G3', 'G4', 'H3', 'H4']);
    expect(WORM_START_SPACES).includes(wormOf(game).spaceId);
    expect(BEHIND_WORM_BORDER).not.includes(WORM_START);
    expect(ARRAKIS_ZONES[WORM_START]).eq('erg');
  });

  it('can leave every start space', () => {
    for (const start of WORM_START_SPACES) {
      expect(ARRAKIS_ZONES[start] ?? 'erg', start).not.eq('rock');
      expect([1, 2, 3, 4, 5, 6].some((roll) => wormDirection(game.board, start, roll) !== undefined), start).is.true;
    }
  });

  it('rolls once more when the die points along the line of the last move', () => {
    const worm: WormData = {spaceId: WORM_START, path: []};
    // Rolls whose heading needs no bounce on the start space; the last move ran the opposite way of the first one
    const free = [1, 2, 3, 4, 5, 6].filter((roll) => wormDirection(game.board, WORM_START, roll) === directionIndex(roll));
    const [first, second] = [free[0], free.find((roll) => wormLine(directionIndex(roll)) !== wormLine(directionIndex(free[0])))!];
    const rolls = [first - 1, second - 1];
    game.rng.nextInt = () => rolls.shift()!;
    worm.direction = (directionIndex(first) + 3) % 6;
    rollWorm(game, worm);
    expect(worm.roll).eq(second);
    expect(worm.direction).eq(directionIndex(second));
    // Only the roll that counts reaches the log, once (Jens 25 Oct 2026)
    const rollLines = game.gameLog.map((message) => formatMessage(message)).filter((line) => line.startsWith('Shai-Hulud heads'));
    expect(rollLines).has.length(1);
    expect(rollLines[0]).match(new RegExp('^Shai-Hulud heads \\(' + second + '\\) '));
  });

  it('keeps the roll when the line changes, and on the first move', () => {
    const worm: WormData = {spaceId: WORM_START, path: []};
    const free = [1, 2, 3, 4, 5, 6].filter((roll) => wormDirection(game.board, WORM_START, roll) === directionIndex(roll));
    const other = free.find((roll) => wormLine(directionIndex(roll)) !== wormLine(directionIndex(free[0])))!;
    let calls = 0;
    game.rng.nextInt = () => {
      calls++;
      return free[0] - 1;
    };
    rollWorm(game, worm);
    worm.direction = directionIndex(other);
    rollWorm(game, worm);
    expect(calls).eq(2);
    expect(worm.roll).eq(free[0]);
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
        for (const crossed of wormPath(game.board, space.id, wormDirection(game.board, space.id, roll), 3)) {
          expect(ARRAKIS_ZONES[crossed.id]).not.eq('rock');
          expect(BEHIND_WORM_BORDER).not.includes(crossed.id);
        }
      }
    }
  });

  it('bounces off when the rolled direction is blocked', () => {
    const start = game.board.getSpaceOrThrow(WORM_START);
    const neighbours = game.board.getAdjacentSpacesClockwise(start);
    const free = [0, 1, 2, 3, 4, 5].filter((direction) => wormPath(game.board, WORM_START, direction, 1)[0]?.id === neighbours[direction]?.id);
    expect(free.length).lessThan(6);
    for (let roll = 1; roll <= 6; roll++) {
      const direction = wormDirection(game.board, WORM_START, roll);
      expect(free).includes(direction);
      // Free rolls keep their direction, blocked ones take the mirrored one
      let expected = directionIndex(roll);
      while (!free.includes(expected)) {
        expected = bouncedDirection(game.board, start, expected);
      }
      expect(direction).eq(expected);
    }
  });

  it('mirrors at a wall: slanted walls turn it by 120°, a single obstacle ahead sends it back', () => {
    const board = game.board;
    for (const space of board.spaces) {
      if (ARRAKIS_ZONES[space.id] === undefined) {
        continue;
      }
      const neighbours = board.getAdjacentSpacesClockwise(space);
      const blocked = (direction: number) => {
        const neighbour = neighbours[direction];
        return neighbour === undefined || ARRAKIS_ZONES[neighbour.id] === 'rock' || ARRAKIS_ZONES[neighbour.id] === 'city' || BEHIND_WORM_BORDER.includes(neighbour.id);
      };
      for (let direction = 0; direction < 6; direction++) {
        const left = blocked((direction + 5) % 6);
        const right = blocked((direction + 1) % 6);
        const expected = left && !right ? (direction + 2) % 6 : right && !left ? (direction + 4) % 6 : (direction + 3) % 6;
        expect(bouncedDirection(board, space, direction), space.id + ' ' + direction).eq(expected);
      }
    }
  });

  it('goes round corners: bouncing costs no step', () => {
    let bent = 0;
    for (const space of game.board.spaces) {
      if (ARRAKIS_ZONES[space.id] === undefined) {
        continue;
      }
      for (let roll = 1; roll <= 6; roll++) {
        const path = wormPath(game.board, space.id, wormDirection(game.board, space.id, roll), 3);
        // Every step goes to a neighbour of the space before
        [space, ...path].slice(0, -1).forEach((from, index) => {
          expect(game.board.getAdjacentSpaces(from).map((adjacent) => adjacent.id)).includes(path[index].id);
        });
        const headings = [space, ...path].slice(0, -1).map((from, index) => game.board.getAdjacentSpacesClockwise(from).findIndex((adjacent) => adjacent?.id === path[index].id));
        if (path.length === 3 && new Set(headings).size > 1) {
          bent++;
        }
      }
    }
    expect(bent).is.greaterThan(0);
  });

  it('moves less on a greener Arrakis: the vegetation track in three sections, filled from the right', () => {
    expect(wormDistanceSections(14)).deep.eq([5, 5, 4]);
    expect(wormDistanceSections(18)).deep.eq([6, 6, 6]);
    expect(maxWormDistance(game)).eq(3);
    setOxygenLevel(game, 3);
    expect(maxWormDistance(game)).eq(3);
    setOxygenLevel(game, 4);
    expect(maxWormDistance(game)).eq(2);
    setOxygenLevel(game, 8);
    expect(maxWormDistance(game)).eq(2);
    setOxygenLevel(game, 9);
    expect(maxWormDistance(game)).eq(1);
    setOxygenLevel(game, game.max.oxygen);
    expect(maxWormDistance(game)).eq(1);
  });

  it('names in the log who chose the distance and with how much TR', () => {
    const worm: WormData = {spaceId: WORM_START, path: [], direction: directionIndex(1), chooser: player2.id};
    player2.setTerraformRating(22);
    cast(distanceInput(game, worm).options[0], SelectOption).cb(undefined);
    const lines = game.gameLog.map((message) => formatMessage(message));
    expect(lines.some((line) => line.startsWith('Shai-Hulud moves') && line.endsWith('decides with 22 TR'))).is.true;
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
    expect(crossSpace(game, greenery)).is.undefined;
    expect(player2.plants).eq(2);
    // Cannot pay 3 plants: the player owes resources worth 4 and chooses them
    player2.plants = 1;
    player2.heat = 2;
    player2.megaCredits = 10;
    const levy = crossSpace(game, greenery);
    expect(levy).deep.eq({player: player2.id, owed: 4});
    payWith(levy!, 'heat');
    expect(levy!.owed).eq(2);
    // Then the remaining worth 2: plants (1) and M€
    expect(player2.heat).eq(0);
  });

  it('lets the player choose what pays the levy', () => {
    player2.steel = 1;
    player2.megaCredits = 1;
    const levy: PendingLevy = {player: player2.id, owed: 4};
    const input = cast(levyInput(player2, levy), OrOptions);
    expect(typeof input.title === 'string' ? input.title : input.title.message).eq(LEVY_TITLE);
    expect(input.options).has.length(2);
    // 1 steel is worth 2, then 2 are left: only M€ remains
    const next = cast(input.options[1], SelectOption).cb(undefined);
    expect(player2.steel).eq(0);
    expect(levy.owed).eq(2);
    expect(cast(next, OrOptions).options).has.length(1);
  });

  it('owes nothing when the player has nothing', () => {
    const greenery = game.board.getAvailableSpacesForGreenery(player2)[0];
    game.addGreenery(player2, greenery);
    player2.megaCredits = 0;
    player2.steel = 0;
    player2.titanium = 0;
    player2.plants = 0;
    player2.energy = 0;
    player2.heat = 0;
    expect(crossSpace(game, greenery)).is.undefined;
  });

  function payWith(levy: PendingLevy, label: string) {
    const input = cast(levyInput(player2, levy), OrOptions);
    const index = input.options.findIndex((option) => formatMessage(option.title).includes(label));
    cast(input.options[index], SelectOption).cb(undefined);
  }

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
    const worm = wormOf(game);
    // One option per distance that ends on a new space (rim or rock may stop the worm early)
    const choices = wormChoices(game, worm);
    expect(input.options).has.length(choices.length);
    const expected = wormPath(game.board, worm.spaceId, worm.direction, 3);
    player2.process({type: 'or', index: choices.length - 1, response: {type: 'option'}});
    if (expected.length > 0) {
      const end = expected[expected.length - 1].id;
      expect(wormOf(game).spaceId).eq(end);
      expect(game.board.getAvailableSpacesOnLand(player1).map((space) => space.id)).not.includes(end);
      expect(game.board.getAvailableSpacesForOcean(player1).map((space) => space.id)).not.includes(end);
    }
  });

  it('lets the worm stay: 0 is always the first choice and keeps it on its space (Jens, 26 Oct 2026)', () => {
    const worm = wormOf(game);
    worm.direction = wormDirection(game.board, worm.spaceId, 1);
    const start = worm.spaceId;
    expect(wormChoices(game, worm)[0]).deep.eq({distance: 0, path: []});
    cast(distanceInput(game, worm).options[0], SelectOption).cb(undefined);
    expect(worm.spaceId).eq(start);
  });

  it('offers each end space once: longer distances that stop at the same space are left out', () => {
    const worm = wormOf(game);
    worm.direction = wormDirection(game.board, worm.spaceId, 1);
    const choices = wormChoices(game, worm);
    expect(choices.length).is.greaterThan(0);
    choices.forEach((choice, index) => {
      if (index > 0) {
        expect(choice.path.length).is.greaterThan(choices[index - 1].path.length);
      }
    });
    expect(distanceInput(game, worm).options).has.length(choices.length);
  });

  it('tells the board where it lies right after a move (marker and blocked space without a reload)', () => {
    const worm = wormOf(game);
    worm.direction = wormDirection(game.board, worm.spaceId, 1);
    moveWorm(game, worm, 1);
    expect((game.board as Arrakis61Board).wormSpaceId).eq(worm.spaceId);
  });

  it('records its trail: every move with its generation, from the starting space on', () => {
    game.generation = 3;
    const worm = wormOf(game);
    worm.spaceId = WORM_START;
    expect(wormModel(game, worm).trail).deep.eq({start: WORM_START, moves: []});
    worm.direction = wormDirection(game.board, worm.spaceId, 1);
    const expected = wormPath(game.board, worm.spaceId, worm.direction, 2).map((space) => space.id);
    moveWorm(game, worm, 2);
    game.generation = 4;
    moveWorm(game, worm, 1);
    const trail = wormModel(game, worm).trail;
    expect(trail.start).eq(WORM_START);
    expect(trail.moves.map((move) => move.generation)).deep.eq([3, 4]);
    expect(trail.moves[0].path).deep.eq(expected);
    // The trail survives a reload
    const restored = Game.deserialize(JSON.parse(JSON.stringify(game.serialize())));
    expect(restored.duneData?.worm?.trail).deep.eq(worm.trail);
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

// The large Arrakis (six spaces a side): its own terrain, start spaces and worm border (common/dune/arrakisLayout.ts)
describe('Shai-Hulud on the large Arrakis', () => {
  let game: IGame;

  beforeEach(() => {
    [game] = testGame(2, {theme: 'dune', boardName: BoardName.ARRAKIS_91, duneModules: ['worm']});
  });

  it('starts on a start space of the large board', () => {
    expect(ARRAKIS_91_LAYOUT.wormStartSpaces).includes(wormOf(game).spaceId);
  });

  it('can leave every start space', () => {
    for (const start of ARRAKIS_91_LAYOUT.wormStartSpaces) {
      expect(ARRAKIS_91_LAYOUT.zones[start], start).not.eq('rock');
      expect([1, 2, 3, 4, 5, 6].some((roll) => wormDirection(game.board, start, roll) !== undefined), start).is.true;
    }
  });

  it('never enters rock or the polar sink of the large board', () => {
    for (const space of game.board.spaces.filter((s) => ARRAKIS_91_LAYOUT.zones[s.id] !== undefined)) {
      for (let roll = 1; roll <= 6; roll++) {
        for (const crossed of wormPath(game.board, space.id, wormDirection(game.board, space.id, roll), 3)) {
          expect(ARRAKIS_91_LAYOUT.zones[crossed.id]).not.eq('rock');
          expect(ARRAKIS_91_LAYOUT.behindWormBorder).not.includes(crossed.id);
        }
      }
    }
  });
});
