import {expect} from 'chai';
import {testGame} from '../TestGame';
import {flowFit} from '../../src/server/ai/cardFit';
import {CardName} from '../../src/common/cards/CardName';
import {IoMiningIndustries} from '../../src/server/cards/base/IoMiningIndustries';
import {GanymedeColony} from '../../src/server/cards/base/GanymedeColony';
import {TerraformingGanymede} from '../../src/server/cards/base/TerraformingGanymede';
import {Herbivores} from '../../src/server/cards/base/Herbivores';
import {Insects} from '../../src/server/cards/base/Insects';
import {NitrophilicMoss} from '../../src/server/cards/base/NitrophilicMoss';

describe('AI card fit to the flow of the game', () => {
  it('is neutral without a tableau', () => {
    const [, player] = testGame(2);
    expect(flowFit(player, CardName.WATER_IMPORT_FROM_EUROPA)).eq(0);
  });

  it('prefers Jovian cards in a Jovian game and plant cards in a plant game', () => {
    const [, jovian] = testGame(2);
    jovian.playedCards.push(new IoMiningIndustries(), new GanymedeColony(), new TerraformingGanymede());
    const [, green] = testGame(2);
    green.playedCards.push(new Herbivores(), new Insects(), new NitrophilicMoss());

    expect(flowFit(jovian, CardName.WATER_IMPORT_FROM_EUROPA)).is.greaterThan(0);
    expect(flowFit(jovian, CardName.WATER_IMPORT_FROM_EUROPA)).is.greaterThan(flowFit(green, CardName.WATER_IMPORT_FROM_EUROPA));
    expect(flowFit(green, CardName.ADAPTED_LICHEN)).is.greaterThan(flowFit(jovian, CardName.ADAPTED_LICHEN));
  });

  it('grows with a clearer flow', () => {
    const [, few] = testGame(2);
    few.playedCards.push(new IoMiningIndustries());
    const [, more] = testGame(2);
    more.playedCards.push(new IoMiningIndustries(), new GanymedeColony(), new TerraformingGanymede());
    expect(flowFit(more, CardName.WATER_IMPORT_FROM_EUROPA)).is.greaterThan(flowFit(few, CardName.WATER_IMPORT_FROM_EUROPA));
  });
});
