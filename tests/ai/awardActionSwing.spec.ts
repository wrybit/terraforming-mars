import {expect} from 'chai';
import {testGame} from '../TestGame';
import {addCity, setOxygenLevel, setTemperature} from '../TestingUtils';
import {clearPlayerTunings} from '../../src/server/ai/aiTuning';
import {playerValue, valuationContext} from '../../src/server/ai/stateValue';
import {Landlord} from '../../src/server/awards/Landlord';

// Late in the game: the player leads a funded Landlord 3 : 1, the opponent still has money.
function lateLead() {
  const [game, player, opponent] = testGame(2);
  game.generation = 12;
  setTemperature(game, 8);
  setOxygenLevel(game, 14);
  addCity(player);
  addCity(player);
  addCity(player);
  addCity(opponent);
  game.fundAward(player, new Landlord());
  opponent.megaCredits = 46;
  return {game, player, opponent};
}

function value(player: ReturnType<typeof lateLead>['player'], awardActionSwing: number): number {
  return playerValue(player, {...valuationContext(player.game, player), awardActionSwing});
}

describe('AI award swing from open actions', () => {
  afterEach(() => clearPlayerTunings());

  it('counts a small lead as less safe while a rich opponent can still act', () => {
    const {player} = lateLead();
    expect(value(player, 1)).is.lessThan(value(player, 0));
  });

  it('changes nothing once everybody has passed', () => {
    const {game, player, opponent} = lateLead();
    game.playerHasPassed(player);
    game.playerHasPassed(opponent);
    expect(value(player, 1)).eq(value(player, 0));
  });
});
