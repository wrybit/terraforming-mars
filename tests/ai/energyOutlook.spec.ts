import {expect} from 'chai';
import {testGame} from '../TestGame';
import {clearPlayerTunings, setPlayerTuning} from '../../src/server/ai/aiTuning';
import {energyOutlookFactor, expectedEnergyRatio} from '../../src/server/ai/energyOutlook';
import {HiTechLab} from '../../src/server/cards/promo/HiTechLab';
import {SolarPower} from '../../src/server/cards/base/SolarPower';
import {Resource} from '../../src/common/Resource';

// Energy-spending draw cards count only the energy they can expect (human game: Hi-Tech Lab at 0 energy, gen 2).
describe('AI energy outlook', () => {
  afterEach(() => clearPlayerTunings());

  it('is off in the baseline', () => {
    const [, player] = testGame(2);
    expect(energyOutlookFactor(player, new HiTechLab(), 8)).eq(1);
  });

  it('gives Hi-Tech Lab nothing without energy and a share with energy production in hand', () => {
    const [, player] = testGame(2);
    setPlayerTuning(player.id, 'energyOutlook');
    const lab = new HiTechLab();
    expect(energyOutlookFactor(player, lab, 8)).eq(0);
    player.cardsInHand.push(new SolarPower());
    expect(expectedEnergyRatio(player, lab, 8)).to.be.greaterThan(0);
    player.production.add(Resource.ENERGY, 2);
    expect(energyOutlookFactor(player, lab, 8)).eq(1);
  });
});
