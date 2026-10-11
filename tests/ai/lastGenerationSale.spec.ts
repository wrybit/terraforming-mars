import {expect} from 'chai';
import {testGame} from '../TestGame';
import {lastGenerationSaleResponses} from '../../src/server/ai/lastGenerationSale';
import {CardName} from '../../src/common/cards/CardName';
import {DustSeals} from '../../src/server/cards/base/DustSeals';
import {TransNeptuneProbe} from '../../src/server/cards/base/TransNeptuneProbe';
import {PowerPlant} from '../../src/server/cards/base/PowerPlant';
import {Sabotage} from '../../src/server/cards/base/Sabotage';
import {Tardigrades} from '../../src/server/cards/base/Tardigrades';
import {Ants} from '../../src/server/cards/base/Ants';
import {Fish} from '../../src/server/cards/base/Fish';

function lastGeneration(money: number) {
  const [game, player] = testGame(2);
  game.generation = 14;
  player.megaCredits = money;
  // Two VP cards (2 and 6 M€), five cards that only bring their sale.
  player.cardsInHand.push(new DustSeals(), new TransNeptuneProbe(), new PowerPlant(), new Sabotage(), new Tardigrades(), new Ants(), new Fish());
  return player;
}

describe('AI last generation sale', () => {
  it('keeps both small VP cards when the sale pays for both', () => {
    const player = lastGeneration(3);
    const [best] = lastGenerationSaleResponses(player);
    // 3 M€ + 5 sold cards = 8 M€ = 2 + 6.
    expect(best).deep.eq({type: 'card', cards: [CardName.POWER_PLANT, CardName.SABOTAGE, CardName.TARDIGRADES, CardName.ANTS, CardName.FISH]});
    expect(player.megaCredits).eq(3);
  });

  it('keeps one VP card when the money only pays for one', () => {
    const player = lastGeneration(0);
    const [best] = lastGenerationSaleResponses(player);
    expect(best?.type).eq('card');
    const sold = best?.type === 'card' ? best.cards : [];
    const kept = [CardName.DUST_SEALS, CardName.TRANS_NEPTUNE_PROBE].filter((name) => !sold.includes(name));
    expect(kept).has.length(1);
  });
});
