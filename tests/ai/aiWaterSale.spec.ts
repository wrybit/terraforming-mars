import {expect} from 'chai';
import {testGame} from '../TestGame';
import {setTemperature} from '../TestingUtils';
import {sellableWater, waterToKeepForAwards} from '../../src/server/dune/aiWaterSale';
import {Thermalist} from '../../src/server/awards/Thermalist';

// At maximum temperature the AI sells surplus water at the guild but keeps what a funded water award lead needs.
describe('AI water sale (Dune)', () => {
  it('sells nothing below maximum temperature', () => {
    const [game, player] = testGame(2);
    setTemperature(game, 0);
    player.heat = 20;
    expect(sellableWater(player)).eq(0);
  });

  it('sells all water at maximum temperature without a funded water award', () => {
    const [game, player] = testGame(2);
    setTemperature(game, game.max.temperature);
    player.heat = 20;
    expect(sellableWater(player)).eq(20);
  });

  it('keeps the water a funded Thermalist lead needs', () => {
    const [game, player, opponent] = testGame(2);
    setTemperature(game, game.max.temperature);
    player.heat = 20;
    opponent.heat = 5;
    game.fundedAwards.push({award: new Thermalist(), player});
    expect(waterToKeepForAwards(player)).eq(6);
    expect(sellableWater(player)).eq(14);
  });
});
