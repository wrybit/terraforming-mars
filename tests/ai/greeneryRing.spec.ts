import {expect} from 'chai';
import {testGame} from '../TestGame';
import {setPlayerTuning, clearPlayerTunings} from '../../src/server/ai/aiTuning';
import {lonelyGreeneryPoints, orphanPotential} from '../../src/server/ai/greeneryRing';
import {TileType} from '../../src/common/TileType';
import {SpaceType} from '../../src/common/boards/SpaceType';
import {Space} from '../../src/server/boards/Space';
import {IPlayer} from '../../src/server/IPlayer';
import {IGame} from '../../src/server/IGame';

describe('AI greenery ring', () => {
  afterEach(() => clearPlayerTunings());

  function greenery(game: IGame, player: IPlayer, space: Space) {
    game.simpleAddTile(player, space, {tileType: TileType.GREENERY});
  }

  /** Land spaces far apart from each other (no shared neighbours), so each greenery stays an orphan. */
  function spreadLand(game: IGame, count: number): Array<Space> {
    const board = game.board;
    const chosen: Array<Space> = [];
    for (const space of board.spaces) {
      if (space.spaceType !== SpaceType.LAND || board.getAdjacentSpaces(space).length < 6) {
        continue;
      }
      const near = (other: Space) => other === space || board.getAdjacentSpaces(other).some((next) =>
        next === space || board.getAdjacentSpaces(space).includes(next));
      if (chosen.some(near)) {
        continue;
      }
      chosen.push(space);
      if (chosen.length === count) {
        break;
      }
    }
    return chosen;
  }

  it('makes a third orphan greenery expensive', () => {
    const [game, player] = testGame(2);
    const [first, second, third, candidate] = spreadLand(game, 4);
    greenery(game, player, first);
    greenery(game, player, second);
    setPlayerTuning(player.id, 'noGreeneryRing');
    expect(lonelyGreeneryPoints(candidate, player, game.board)).eq(0);
    setPlayerTuning(player.id, 'greeneryRing1');
    const withTwo = lonelyGreeneryPoints(candidate, player, game.board);
    greenery(game, player, third);
    expect(lonelyGreeneryPoints(candidate, player, game.board)).lessThan(withTwo);
    expect(orphanPotential(player, game.board)).lessThan(0);
  });

  it('avoids a lonely greenery no own city can ever reach', () => {
    const [game, player, rival] = testGame(2);
    const [dead, open] = spreadLand(game, 2);
    // Every free neighbour of the dead spot is taken: no city can ever touch a greenery there.
    for (const next of game.board.getAdjacentSpaces(dead)) {
      if (next.tile === undefined && next.spaceType === SpaceType.LAND) {
        greenery(game, rival, next);
      }
    }
    setPlayerTuning(player.id, 'greeneryRing1');
    expect(lonelyGreeneryPoints(dead, player, game.board)).lessThan(lonelyGreeneryPoints(open, player, game.board));
  });

  it('pulls a lonely greenery next to the free city spot of an earlier one', () => {
    const [game, player] = testGame(2);
    const [orphan, , far] = spreadLand(game, 3);
    greenery(game, player, orphan);
    const board = game.board;
    const isFreeLand = (space: Space) => space.spaceType === SpaceType.LAND && space.tile === undefined;
    // A free neighbour of a free city spot next to the first greenery, not touching that greenery:
    // a city on the spot would adopt both.
    const beside = board.getAdjacentSpaces(orphan).filter(isFreeLand)
      .flatMap((spot) => board.getAdjacentSpaces(spot))
      .find((next) => next !== orphan && isFreeLand(next) && !board.getAdjacentSpaces(next).includes(orphan))!;
    expect(beside).not.undefined;
    expect(far).not.undefined;
    setPlayerTuning(player.id, 'greeneryRing1');
    expect(lonelyGreeneryPoints(beside, player, board)).greaterThan(lonelyGreeneryPoints(far, player, board));
  });
});
