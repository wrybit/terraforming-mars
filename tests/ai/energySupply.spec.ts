import {expect} from 'chai';
import {testGame} from '../TestGame';
import {energyPerAction, energySupplyRatio} from '../../src/server/ai/energySupply';
import {PhysicsComplex} from '../../src/server/cards/base/PhysicsComplex';
import {Ironworks} from '../../src/server/cards/base/Ironworks';
import {WaterSplittingPlant} from '../../src/server/cards/base/WaterSplittingPlant';
import {Research} from '../../src/server/cards/base/Research';
import {Resource} from '../../src/common/Resource';
import {clearPlayerTunings, setPlayerTuning} from '../../src/server/ai/aiTuning';
import {estimateCardValues} from '../../src/server/ai/cardValue';

describe('AI energy supply', () => {
  it('reads the energy an action spends from the card icons', () => {
    expect(energyPerAction(new PhysicsComplex())).eq(6);
    expect(energyPerAction(new Ironworks())).eq(4);
    expect(energyPerAction(new WaterSplittingPlant())).eq(3);
    expect(energyPerAction(new Research())).eq(0);
  });

  it('sees that one energy production cannot feed Physics Complex', () => {
    const [, player] = testGame(2);
    player.production.add(Resource.ENERGY, 1);
    expect(energySupplyRatio(player, new PhysicsComplex(), 8)).is.lessThan(0.2);
    player.production.add(Resource.ENERGY, 5);
    expect(energySupplyRatio(player, new PhysicsComplex(), 8)).eq(1);
  });

  it('counts the energy other actions in play already use', () => {
    const [, player] = testGame(2);
    player.production.add(Resource.ENERGY, 4);
    expect(energySupplyRatio(player, new Ironworks(), 8)).eq(1);
    player.playedCards.push(new WaterSplittingPlant());
    expect(energySupplyRatio(player, new Ironworks(), 8)).eq(0.25);
  });

  it('values Physics Complex lower without the energy to run it', () => {
    const [game, player] = testGame(2);
    game.generation = 5;
    player.production.add(Resource.ENERGY, 1);
    player.megaCredits = 40;
    const card = new PhysicsComplex();
    const after = estimateCardValues(player, [card]).get(card.name) ?? 0;
    setPlayerTuning(player.id, 'noEnergySupply');
    const before = estimateCardValues(player, [card]).get(card.name) ?? 0;
    clearPlayerTunings();
    expect(after).is.lessThan(before);
  });
});
