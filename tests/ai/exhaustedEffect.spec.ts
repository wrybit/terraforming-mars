import {expect} from 'chai';
import {testGame} from '../TestGame';
import {effectExhausted} from '../../src/server/ai/exhaustedEffect';
import {ArcticAlgae} from '../../src/server/cards/base/ArcticAlgae';
import {Pets} from '../../src/server/cards/base/Pets';
import {maxOutOceans} from '../TestingUtils';

// Effects triggered by a global parameter earn nothing once it is maxed (human game: Arctic Algae at 9/9 oceans).
describe('AI exhausted effects', () => {
  it('Arctic Algae earns nothing once all oceans are placed', () => {
    const [game, player] = testGame(2);
    const algae = new ArcticAlgae();
    expect(effectExhausted(algae, game)).is.false;
    maxOutOceans(player);
    expect(effectExhausted(algae, game)).is.true;
  });

  it('effects without a global parameter trigger are never exhausted', () => {
    const [game, player] = testGame(2);
    maxOutOceans(player);
    expect(effectExhausted(new Pets(), game)).is.false;
  });
});
