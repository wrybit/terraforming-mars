import {expect} from 'chai';
import {testGame} from '../TestGame';
import {clearPlayerTunings, setPlayerTuning} from '../../src/server/ai/aiTuning';
import {drawEngineBonus, drawsPerGeneration} from '../../src/server/ai/drawEngineBoost';
import {AICentral} from '../../src/server/cards/base/AICentral';
import {DevelopmentCenter} from '../../src/server/cards/base/DevelopmentCenter';
import {PowerPlant} from '../../src/server/cards/base/PowerPlant';

// Draw engines get extra value for every generation they keep drawing.
describe('AI draw engine boost', () => {
  afterEach(() => clearPlayerTunings());

  it('counts cards drawn by action per generation', () => {
    const [, player] = testGame(2);
    expect(drawsPerGeneration(new AICentral(), player)).to.eq(2);
    expect(drawsPerGeneration(new DevelopmentCenter(), player)).to.eq(1);
    expect(drawsPerGeneration(new PowerPlant(), player)).to.eq(0);
  });

  it('is off without the rule and grows with the remaining generations', () => {
    const [, player] = testGame(2);
    expect(drawEngineBonus(new AICentral(), player, 8)).to.eq(0);
    setPlayerTuning(player.id, 'drawEngine1');
    const early = drawEngineBonus(new AICentral(), player, 8);
    const late = drawEngineBonus(new AICentral(), player, 2);
    expect(early).to.be.greaterThan(late);
    expect(late).to.be.greaterThan(0);
    expect(drawEngineBonus(new PowerPlant(), player, 8)).to.eq(0);
  });
});
