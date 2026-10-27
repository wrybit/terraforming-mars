import {expect} from 'chai';
import {testGame} from '../TestGame';
import {clearPlayerTunings, setPlayerTuning} from '../../src/server/ai/aiTuning';
import {spaceValue} from '../../src/server/ai/spaceValue';
import {cityClaimSpreadBonus} from '../../src/server/ai/cityClaimSpread';
import {IGame} from '../../src/server/IGame';
import {Space} from '../../src/server/boards/Space';
import {SpaceType} from '../../src/common/boards/SpaceType';
import {SpaceBonus} from '../../src/common/boards/SpaceBonus';

// Round 149: city first, no greenery nests, spread-out cities (human games 24.–26.10.).
describe('AI round 149 variants', () => {
  afterEach(() => clearPlayerTunings());

  function landSpaces(game: IGame): Array<Space> {
    return game.board.spaces.filter((space) => space.spaceType === SpaceType.LAND && space.tile === undefined);
  }

  /** Free land spaces in the middle of the board (more than 3 land neighbours). */
  function innerLand(game: IGame): Array<Space> {
    return landSpaces(game).filter((space) =>
      game.board.getAdjacentSpaces(space).filter((neighbour) => neighbour.spaceType === SpaceType.LAND).length > 3);
  }

  /** Spaces exactly `steps` away from the start (breadth-first over the board). */
  function spacesAt(game: IGame, start: Space, steps: number): Array<Space> {
    let frontier = [start];
    const seen = new Set([start.id]);
    for (let step = 0; step < steps; step++) {
      const next: Array<Space> = [];
      for (const space of frontier) {
        for (const neighbour of game.board.getAdjacentSpaces(space)) {
          if (!seen.has(neighbour.id)) {
            seen.add(neighbour.id);
            next.push(neighbour);
          }
        }
      }
      frontier = next;
    }
    return frontier;
  }

  it('cityFirst: a greenery without an own city is worth less while cities do not lead', () => {
    const [game, player] = testGame(2);
    const space = innerLand(game)[0];
    const plain = spaceValue(space, 'greenery', player);
    setPlayerTuning(player.id, 'cityFirst');
    expect(spaceValue(space, 'greenery', player)).to.be.lessThan(plain);
  });

  it('nestGuard: open city spots count only when an opponent can afford a city', () => {
    const [game, player, opponent] = testGame(2);
    const space = innerLand(game)[0];
    opponent.megaCredits = 0;
    const plain = spaceValue(space, 'greenery', player);
    setPlayerTuning(player.id, 'nestGuard');
    expect(spaceValue(space, 'greenery', player)).eq(plain);
    opponent.megaCredits = 30;
    expect(spaceValue(space, 'greenery', player)).to.be.lessThan(plain);
  });

  it('cityClaimSpread: the second city gains three or four spaces away from the first', () => {
    const [game, player] = testGame(2);
    const first = innerLand(game)[0];
    game.addCity(player, first);
    const far = spacesAt(game, first, 3).find((space) => space.spaceType === SpaceType.LAND && space.tile === undefined);
    expect(far).is.not.undefined;
    expect(cityClaimSpreadBonus(far!, player)).eq(0);
    setPlayerTuning(player.id, 'cityClaimSpread');
    expect(cityClaimSpreadBonus(far!, player)).to.be.at.least(1);
  });

  it('cityClaimSpread: an early city on a card space gains', () => {
    const [game, player] = testGame(2);
    const card = landSpaces(game).find((space) => space.bonus.includes(SpaceBonus.DRAW_CARD));
    expect(card).is.not.undefined;
    setPlayerTuning(player.id, 'cityClaimSpread');
    expect(cityClaimSpreadBonus(card!, player)).to.be.at.least(0.5);
  });
});
