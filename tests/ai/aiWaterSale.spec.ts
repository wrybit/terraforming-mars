import {expect} from 'chai';
import {testGame} from '../TestGame';
import {setTemperature} from '../TestingUtils';
import {sellableWater, waterToKeepForAwards, WATER_AWARD_BUFFER} from '../../src/server/dune/aiWaterSale';
import {Thermalist} from '../../src/server/awards/Thermalist';
import {IGame} from '../../src/server/IGame';
import {IPlayer} from '../../src/server/IPlayer';

// At maximum temperature the AI sells surplus water at the guild, but keeps what a water award needs against the
// opponents' reachable water plus a buffer. Without a water award or milestone all of it may go.
describe('AI water sale (Dune)', () => {
  function thermalistOf(game: IGame) {
    return game.awards.find((award) => award instanceof Thermalist) ?? new Thermalist();
  }

  function fund(game: IGame, player: IPlayer) {
    game.fundedAwards.push({award: thermalistOf(game), player});
  }

  it('sells nothing below maximum temperature', () => {
    const [game, player] = testGame(2);
    setTemperature(game, 0);
    player.heat = 20;
    expect(sellableWater(player)).eq(0);
  });

  it('sells all water when the game has no water award or milestone', () => {
    const [game, player] = testGame(2);
    setTemperature(game, game.max.temperature);
    game.awards.splice(0, game.awards.length, ...game.awards.filter((award) => !(award instanceof Thermalist)));
    player.heat = 20;
    expect(sellableWater(player)).eq(20);
  });

  it('keeps the opponent\'s water plus the buffer for a funded water award', () => {
    const [game, player, opponent] = testGame(2);
    setTemperature(game, game.max.temperature);
    player.heat = 20;
    opponent.heat = 5;
    fund(game, player);
    expect(waterToKeepForAwards(player)).eq(5 + WATER_AWARD_BUFFER);
    expect(sellableWater(player)).eq(20 - 5 - WATER_AWARD_BUFFER);
  });

  it('counts what the opponent can still add from energy and production', () => {
    const [game, player, opponent] = testGame(2);
    setTemperature(game, game.max.temperature);
    player.heat = 30;
    opponent.heat = 5;
    opponent.energy = 2;
    opponent.production.override({heat: 3});
    fund(game, player);
    expect(waterToKeepForAwards(player)).to.be.at.least(5 + 2 + 3 + WATER_AWARD_BUFFER);
  });

  it('keeps water for an unfunded water award while award slots are open', () => {
    const [game, player, opponent] = testGame(2);
    setTemperature(game, game.max.temperature);
    player.heat = 20;
    opponent.heat = 5;
    expect(game.allAwardsFunded()).is.false;
    expect(waterToKeepForAwards(player)).eq(5 + WATER_AWARD_BUFFER);
  });

  it('sells all water when the award cannot be won any more', () => {
    const [game, player, opponent] = testGame(2);
    setTemperature(game, game.max.temperature);
    player.heat = 5;
    opponent.heat = 30;
    fund(game, opponent);
    expect(sellableWater(player)).eq(5);
  });

  it('sells all water when all award slots are taken by other awards', () => {
    const [game, player, opponent] = testGame(2);
    setTemperature(game, game.max.temperature);
    player.heat = 20;
    opponent.heat = 5;
    for (const award of game.awards.filter((award) => !(award instanceof Thermalist)).slice(0, 3)) {
      game.fundedAwards.push({award, player: opponent});
    }
    expect(game.allAwardsFunded()).is.true;
    expect(sellableWater(player)).eq(20);
  });
});
