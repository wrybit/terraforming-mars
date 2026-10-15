import {expect} from 'chai';
import {testGame} from '../TestGame';
import {maxOutOceans, setOxygenLevel, setTemperature} from '../TestingUtils';
import {clearPlayerTunings, setPlayerTuning} from '../../src/server/ai/aiTuning';
import {cardPayment} from '../../src/server/ai/greedyPayment';
import {Miner} from '../../src/server/awards/Miner';
import {ImmigrantCity} from '../../src/server/cards/base/ImmigrantCity';

// Last generation, funded Miner 9 : 10 – steel spent on a card loses it (human game, lost by 2 VP).
function closeMinerRace() {
  const [game, player, opponent] = testGame(2);
  game.generation = 12;
  setTemperature(game, 8);
  setOxygenLevel(game, 14);
  maxOutOceans(player);
  game.fundAward(opponent, new Miner());
  player.steel = 2;
  player.titanium = 6;
  opponent.steel = 10;
  player.megaCredits = 20;
  return player;
}

describe('AI keeps steel for a close stock award', () => {
  afterEach(() => clearPlayerTunings());

  it('pays with M€ and keeps the steel the award counts', () => {
    const player = closeMinerRace();
    setPlayerTuning(player.id, 'keepAwardStock');
    const payment = cardPayment(player, new ImmigrantCity());
    expect(payment.steel).eq(0);
    expect(payment.megacredits).eq(13);
  });

  it('spends the steel without the rule', () => {
    const player = closeMinerRace();
    const payment = cardPayment(player, new ImmigrantCity());
    expect(payment.steel).eq(2);
  });

  it('falls back to the steel when M€ does not cover the cost', () => {
    const player = closeMinerRace();
    setPlayerTuning(player.id, 'keepAwardStock');
    player.megaCredits = 9;
    const payment = cardPayment(player, new ImmigrantCity());
    expect(payment.steel).eq(2);
    expect(payment.megacredits).eq(9);
  });
});
