import {expect} from 'chai';
import {testGame} from '../TestGame';
import {clearPlayerTunings, setPlayerTuning} from '../../src/server/ai/aiTuning';
import {openingSynergy} from '../../src/server/ai/openingSynergy';
import {CardName} from '../../src/common/cards/CardName';

// Preludes were valued alone, so a prelude city brought Tharsis Republic nothing extra (players pick preludes that
// fit the corporation: cities for Tharsis, plants for Ecoline).
describe('AI opening synergy of corporation and preludes', () => {
  afterEach(() => clearPlayerTunings());

  it('sees the extra income a prelude city brings Tharsis Republic', () => {
    const [, player] = testGame(2);
    setPlayerTuning(player.id, 'openingSynergy');
    const settlement = openingSynergy(player, CardName.THARSIS_REPUBLIC, [CardName.EARLY_SETTLEMENT, CardName.MOHOLE]);
    const noCity = openingSynergy(player, CardName.THARSIS_REPUBLIC, [CardName.MOHOLE, CardName.ECOLOGY_EXPERTS]);
    expect(settlement).to.be.greaterThan(noCity + 2);
  });

  it('is off in the baseline', () => {
    const [, player] = testGame(2);
    expect(openingSynergy(player, CardName.THARSIS_REPUBLIC, [CardName.EARLY_SETTLEMENT])).to.equal(0);
  });
});
