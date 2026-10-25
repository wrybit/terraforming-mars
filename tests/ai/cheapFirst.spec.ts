import {expect} from 'chai';
import {testGame} from '../TestGame';
import {clearPlayerTunings, setPlayerTuning} from '../../src/server/ai/aiTuning';
import {cheapFirstPenalty} from '../../src/server/ai/cheapFirst';
import {Research} from '../../src/server/cards/base/Research';
import {Tardigrades} from '../../src/server/cards/base/Tardigrades';

// Of several playable hand cards, the more expensive ones give up a share of their extra cost.
describe('AI cheap first', () => {
  afterEach(() => clearPlayerTunings());

  it('is off in the baseline', () => {
    const [, player] = testGame(2);
    player.cardsInHand.push(new Research(), new Tardigrades());
    expect(cheapFirstPenalty(player, new Research().name, new Set([new Research().name, new Tardigrades().name]))).to.eq(0);
  });

  it('costs the expensive card a share of its extra cost, the cheapest nothing', () => {
    const [, player] = testGame(2);
    setPlayerTuning(player.id, 'cheapFirst05');
    const research = new Research();
    const tardigrades = new Tardigrades();
    player.cardsInHand.push(research, tardigrades);
    const playable = new Set([research.name, tardigrades.name]);
    expect(cheapFirstPenalty(player, research.name, playable)).to.be.closeTo(0.5 * (research.cost - tardigrades.cost), 0.01);
    expect(cheapFirstPenalty(player, tardigrades.name, playable)).to.eq(0);
  });
});
