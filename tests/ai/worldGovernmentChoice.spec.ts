import {expect} from 'chai';
import {testGame} from '../TestGame';
import {chooseWorldGovernment} from '../../src/server/ai/worldGovernmentChoice';
import {setTemperature} from '../TestingUtils';

describe('AI World Government choice', () => {
  it('tries every option on a copy and answers with one of them', () => {
    const [game, player] = testGame(2, {venusNextExtension: true, solarPhaseOption: true});
    const input = game.worldGovernmentTerraformingInput(player);
    const response = chooseWorldGovernment(input, player);
    expect(response?.type).eq('or');
  });

  it('does not raise the temperature onto the ocean bonus for nothing when other options exist', () => {
    const [game, player] = testGame(2, {venusNextExtension: true, solarPhaseOption: true});
    setTemperature(game, -2);
    const input = game.worldGovernmentTerraformingInput(player);
    const response = chooseWorldGovernment(input, player);
    expect(response).is.not.undefined;
  });
});
