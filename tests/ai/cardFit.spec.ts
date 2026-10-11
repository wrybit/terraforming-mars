import {expect} from 'chai';
import {testGame} from '../TestGame';
import {flowFit, withOpeningFit} from '../../src/server/ai/cardFit';
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

  it('sees the direction already in the opening', () => {
    const flat = () => 10;
    const plants = [CardName.ADAPTED_LICHEN, CardName.NITROPHILIC_MOSS, CardName.HERBIVORES, CardName.INSECTS];
    const green = withOpeningFit(flat, 1, CardName.ECOLINE, [], plants);
    const jovian = withOpeningFit(flat, 1, CardName.SATURN_SYSTEMS, [], plants);
    // Plant cards fit Ecoline, and Ecoline fits an opening hand full of plants.
    expect(green(CardName.ADAPTED_LICHEN)).is.greaterThan(jovian(CardName.ADAPTED_LICHEN));
    expect(green(CardName.ECOLINE)).is.greaterThan(10);
    // A bad card stays bad.
    expect(withOpeningFit(() => -5, 1, CardName.ECOLINE, [], plants)(CardName.ADAPTED_LICHEN)).eq(-5);
  });
});
