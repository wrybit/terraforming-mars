import {expect} from 'chai';
import {testGame} from '../TestGame';
import {clearPlayerTunings, setPlayerTuning} from '../../src/server/ai/aiTuning';
import {greeneryBetweenCitiesBonus} from '../../src/server/ai/greeneryBetweenCities';

// Human games: greeneries between two or more own cities 53 % for humans, 23 % for the AI.
describe('AI greenery between own cities', () => {
  afterEach(() => clearPlayerTunings());

  it('is off in the baseline', () => {
    const [, player] = testGame(2);
    expect(greeneryBetweenCitiesBonus(player, 3)).eq(0);
  });

  it('rewards the second and further own city next to the space', () => {
    const [, player] = testGame(2);
    setPlayerTuning(player.id, 'greeneryBetweenCities');
    expect(greeneryBetweenCitiesBonus(player, 1)).eq(0);
    expect(greeneryBetweenCitiesBonus(player, 2)).to.be.greaterThan(0);
    expect(greeneryBetweenCitiesBonus(player, 3)).to.be.greaterThan(greeneryBetweenCitiesBonus(player, 2));
  });
});
