import {expect} from 'chai';
import {testGame} from '../TestGame';
import {quickResponse} from '../../src/server/ai/quickResponse';
import {SelectSpace} from '../../src/server/inputs/SelectSpace';
import {SpaceType} from '../../src/common/boards/SpaceType';
import {Board} from '../../src/server/boards/Board';

// Land Claim reserves a space for an own later tile (human game: the AI claimed a bonus space where it could build
// no city and only a greenery for the opponent's city fit).
describe('AI land claim space', () => {
  it('claims a space for an own city rather than a bonus space next to an opponent city', () => {
    const [game, player, opponent] = testGame(2);
    const board = game.board;
    const land = board.spaces.filter((space) => space.spaceType === SpaceType.LAND && space.tile === undefined);
    // A bonus space with a free land neighbour for the opponent's city.
    const bonusSpace = land.find((space) => space.bonus.length >= 2 &&
      board.getAdjacentSpaces(space).some((neighbour) => neighbour.spaceType === SpaceType.LAND));
    expect(bonusSpace).not.to.be.undefined;
    const cityNeighbour = board.getAdjacentSpaces(bonusSpace!).find((neighbour) => neighbour.spaceType === SpaceType.LAND)!;
    game.addCity(opponent, cityNeighbour);
    // A plain space far from every city, where the own city can go.
    const plain = land.find((space) => space.bonus.length === 0 && space.id !== cityNeighbour.id &&
      !board.getAdjacentSpaces(space).some((neighbour) => Board.isCitySpace(neighbour) || neighbour.id === bonusSpace!.id || neighbour.id === cityNeighbour.id));
    expect(plain).not.to.be.undefined;
    const response = quickResponse(new SelectSpace('Select space for claim', [bonusSpace!, plain!]), player);
    expect(response.type === 'space' ? response.spaceId : undefined).eq(plain!.id);
  });
});
