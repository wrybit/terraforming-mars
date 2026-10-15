import {expect} from 'chai';
import {testGame} from '../TestGame';
import {KuiperCooperative} from '../../src/server/cards/promo/KuiperCooperative';
import {AquiferStandardProject} from '../../src/server/cards/base/standardProjects/AquiferStandardProject';
import {Dirigibles} from '../../src/server/cards/venusNext/Dirigibles';
import {StratosphericBirds} from '../../src/server/cards/venusNext/StratosphericBirds';
import {cardPayment} from '../../src/server/ai/greedyPayment';

describe('AI greedy payment', () => {
  it('pays the aquifer project with Kuiper asteroids', () => {
    const [, player] = testGame(2);
    const kuiper = new KuiperCooperative();
    player.playedCards.push(kuiper);
    kuiper.resourceCount = 20;
    player.megaCredits = 2;
    const payment = cardPayment(player, new AquiferStandardProject());
    expect(payment.kuiperAsteroids).eq(18);
    expect(payment.megacredits).eq(0);
  });

  it('keeps the last floater Stratospheric Birds needs', () => {
    const [, player] = testGame(2);
    const dirigibles = new Dirigibles();
    player.playedCards.push(dirigibles);
    dirigibles.resourceCount = 2;
    player.megaCredits = 20;
    const payment = cardPayment(player, new StratosphericBirds());
    expect(payment.floaters).eq(1);
  });
});
