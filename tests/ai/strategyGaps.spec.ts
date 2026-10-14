import {expect} from 'chai';
import {testGame} from '../TestGame';
import {setOxygenLevel, setTemperature} from '../TestingUtils';
import {openBonusValue} from '../../src/server/ai/bonusRace';
import {handTargetFactor} from '../../src/server/ai/handPlan';
import {expectedAttackLoss} from '../../src/server/ai/attackExposure';
import {Birds} from '../../src/server/cards/base/Birds';
import {Predators} from '../../src/server/cards/base/Predators';
import {ProtectedHabitats} from '../../src/server/cards/base/ProtectedHabitats';
import {collectorRate} from '../../src/server/ai/collectorRate';
import {remainingAtRecentPace} from '../../src/server/ai/recentPace';

describe('AI strategy-guide gaps', () => {
  it('sees the ocean bonus one temperature step away for an opponent with heat', () => {
    const [game, , opponent] = testGame(2);
    opponent.heat = 8;
    setTemperature(game, -2);
    expect(openBonusValue(opponent, 10, 3)).eq(12);
    // Two steps away: the next raise gives no bonus.
    setTemperature(game, -4);
    expect(openBonusValue(opponent, 10, 3)).eq(0);
  });

  it('sees the temperature bonus at 8 % oxygen, weighted by the opponent reach', () => {
    const [game, , opponent] = testGame(2);
    setOxygenLevel(game, 7);
    opponent.plants = 0;
    opponent.megaCredits = 0;
    const withoutStock = openBonusValue(opponent, 10, 3);
    opponent.plants = 8;
    expect(openBonusValue(opponent, 10, 3)).eq(10);
    expect(withoutStock).lessThan(10);
  });

  it('keeps a bigger hand with the stronger income and a smaller one when behind', () => {
    const [, player, opponent] = testGame(2);
    expect(handTargetFactor(player, 1)).eq(1);
    player.production.override({megacredits: 10});
    expect(handTargetFactor(player, 1)).greaterThan(1);
    expect(handTargetFactor(opponent, 1)).lessThan(1);
    expect(handTargetFactor(opponent, 0)).eq(1);
  });

  it('counts plants and animals that the opponent can take, unless protected', () => {
    const [, player, opponent] = testGame(2);
    player.plants = 10;
    const plantLoss = expectedAttackLoss(player, 5, 5);
    expect(plantLoss).greaterThan(0);
    const birds = new Birds();
    player.playedCards.push(birds);
    birds.resourceCount = 4;
    expect(expectedAttackLoss(player, 5, 5)).eq(plantLoss);
    opponent.playedCards.push(new Predators());
    expect(expectedAttackLoss(player, 5, 5)).greaterThan(plantLoss);
    player.playedCards.push(new ProtectedHabitats());
    player.plants = 0;
    expect(expectedAttackLoss(player, 0, 5)).eq(0);
  });

  it('knows the measured feeding rate of collector cards', () => {
    expect(collectorRate('Herbivores')).greaterThan(collectorRate('Tardigrades'));
    expect(collectorRate('Unknown Card')).eq(1);
  });

  it('estimates the remaining generations from the pace of the last generation', () => {
    const [game] = testGame(2);
    game.globalsPerGeneration = [{temperature: -20, oxygen: 4, oceans: 3}, {temperature: -10, oxygen: 8, oceans: 5}];
    // 5 + 4 + 2 = 11 steps in the last generation: 22 steps left are two more generations, the next ends it.
    expect(remainingAtRecentPace(game, 22)).eq(1);
    game.globalsPerGeneration = [{temperature: -20}];
    expect(remainingAtRecentPace(game, 22)).is.undefined;
  });
});
