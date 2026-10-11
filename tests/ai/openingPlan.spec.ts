import {expect} from 'chai';
import {testGame} from '../TestGame';
import {clearPlayerTunings, setPlayerTuning} from '../../src/server/ai/aiTuning';
import {openingPlan} from '../../src/server/ai/openingPlan';
import {spaceValue} from '../../src/server/ai/spaceValue';
import {IPlayer} from '../../src/server/IPlayer';

function best(player: IPlayer, kind: 'greenery' | 'city') {
  const board = player.game.board;
  const spaces = kind === 'city' ? board.getAvailableSpacesForCity(player) : board.getAvailableSpacesForGreenery(player);
  return [...spaces].sort((a, b) => spaceValue(b, kind, player) - spaceValue(a, kind, player))[0];
}

describe('AI opening plan', () => {
  afterEach(() => clearPlayerTunings());

  it('is off in the baseline', () => {
    const [/* game */, player] = testGame(2);
    expect(openingPlan(player, () => 0)).is.undefined;
  });

  it('puts the first greenery next to the planned city and the city next to it', () => {
    const [game, player] = testGame(2);
    setPlayerTuning(player.id, 'openingPlan');
    const plan = openingPlan(player, (space) => spaceValue(space, 'city', player));
    expect(plan).is.not.undefined;
    expect(plan!.greeneries).has.length(2);

    const greenery = best(player, 'greenery');
    expect(plan!.greeneries).includes(greenery.id);
    game.addGreenery(player, greenery);

    // The city goes into the cluster, next to the greenery.
    const city = best(player, 'city');
    expect(game.board.getAdjacentSpaces(city).map((space) => space.id)).includes(greenery.id);
    game.addCity(player, city);
    expect(openingPlan(player, () => 0)).is.undefined;
  });
});
