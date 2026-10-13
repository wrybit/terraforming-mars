import {expect} from 'chai';
import {testGame} from '../TestGame';
import {cast} from '../../src/common/utils/utils';
import {quickResponse} from '../../src/server/ai/quickResponse';
import {PublicPlans} from '../../src/server/cards/promo/PublicPlans';
import {SelectCard} from '../../src/server/inputs/SelectCard';
import {Tardigrades} from '../../src/server/cards/base/Tardigrades';
import {Sabotage} from '../../src/server/cards/base/Sabotage';
import {PowerPlant} from '../../src/server/cards/base/PowerPlant';

describe('AI quick response', () => {
  it('reveals every hand card for Public Plans', () => {
    const [/* game */, player] = testGame(2);
    player.cardsInHand.push(new Tardigrades(), new Sabotage(), new PowerPlant());
    const input = cast(new PublicPlans().play(player), SelectCard);
    const response = quickResponse(input, player);
    expect(response.type).eq('card');
    expect(response.type === 'card' ? response.cards.length : 0).eq(3);
  });
});
