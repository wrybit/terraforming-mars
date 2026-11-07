import {expect} from 'chai';
import {testGame} from '../TestGame';
import {clearPlayerTunings, setPlayerTuning} from '../../src/server/ai/aiTuning';
import {clearLaterValueCacheForTest, estimateCardTimings} from '../../src/server/ai/cardValue';
import {MedicalLab} from '../../src/server/cards/base/MedicalLab';
import {GeothermalPower} from '../../src/server/cards/base/GeothermalPower';
import {Mine} from '../../src/server/cards/base/Mine';
import {TitaniumMine} from '../../src/server/cards/base/TitaniumMine';
import {PowerPlant} from '../../src/server/cards/base/PowerPlant';
import {SolarPower} from '../../src/server/cards/base/SolarPower';
import {IndustrialMicrobes} from '../../src/server/cards/base/IndustrialMicrobes';
import {FoodFactory} from '../../src/server/cards/base/FoodFactory';
import {GHGFactories} from '../../src/server/cards/base/GHGFactories';

// Cards whose production grows with own tags should see the tags waiting in the own hand.
describe('AI counts the own hand in the future tableau of a later value', () => {
  beforeEach(() => clearLaterValueCacheForTest());
  afterEach(() => clearPlayerTunings());

  function laterOfMedicalLab(variant: string | undefined): number {
    const [, player] = testGame(2);
    if (variant !== undefined) {
      setPlayerTuning(player.id, variant);
    }
    // Eight different building cards: the tableau keeps one card per name.
    player.cardsInHand.push(new GeothermalPower(), new Mine(), new TitaniumMine(), new PowerPlant(), new SolarPower(), new IndustrialMicrobes(), new FoodFactory(), new GHGFactories());
    return estimateCardTimings(player, [new MedicalLab()]).get(new MedicalLab().name)!.later;
  }

  it('values Medical Lab higher with building cards in hand', () => {
    const plain = laterOfMedicalLab(undefined);
    const withHand = laterOfMedicalLab('futureHand1');
    expect(withHand).to.be.greaterThan(plain);
  });
});
