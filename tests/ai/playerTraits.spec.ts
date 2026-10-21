import {expect} from 'chai';
import {testGame} from '../TestGame';
import {clearPlayerTunings, setPlayerTuning} from '../../src/server/ai/aiTuning';
import {heatAsMoney, plantFactor, steelFactor, titaniumFactor} from '../../src/server/ai/playerTraits';
import {AdvancedAlloys} from '../../src/server/cards/base/AdvancedAlloys';

// Lasting player traits (steel/titanium value, plants per greenery, heat as M€) count in the position value.
describe('AI player traits', () => {
  afterEach(() => clearPlayerTunings());

  it('is neutral without the rule', () => {
    const [, player] = testGame(2);
    setPlayerTuning(player.id, 'noCardFix');
    player.increaseSteelValue();
    expect(steelFactor(player)).to.eq(1);
  });

  it('raises steel and titanium production with Advanced Alloys', () => {
    const [, player] = testGame(2);
    setPlayerTuning(player.id, 'playerTraits');
    expect(steelFactor(player)).to.eq(1);
    new AdvancedAlloys().play(player);
    expect(steelFactor(player)).to.eq(1.5);
    expect(titaniumFactor(player)).to.be.closeTo(4 / 3, 1e-9);
  });

  it('values plants and heat by the traits', () => {
    const [, player] = testGame(2);
    setPlayerTuning(player.id, 'playerTraits');
    player.plantsNeededForGreenery = 7;
    expect(plantFactor(player)).to.be.closeTo(8 / 7, 1e-9);
    expect(heatAsMoney(player, 0)).to.eq(0);
    player.canUseHeatAsMegaCredits = true;
    expect(heatAsMoney(player, 0)).to.eq(1);
  });
});
