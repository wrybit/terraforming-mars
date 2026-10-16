import {expect} from 'chai';
import {testGame} from '../TestGame';
import {cast} from '../../src/common/utils/utils';
import {quickResponse} from '../../src/server/ai/quickResponse';
import {PublicPlans} from '../../src/server/cards/promo/PublicPlans';
import {SelectCard} from '../../src/server/inputs/SelectCard';
import {Tardigrades} from '../../src/server/cards/base/Tardigrades';
import {Sabotage} from '../../src/server/cards/base/Sabotage';
import {PowerPlant} from '../../src/server/cards/base/PowerPlant';
import {ChooseCards} from '../../src/server/deferredActions/ChooseCards';
import {recordDecision, takeAiDecisionSummary} from '../../src/server/ai/decisionTrace';
import {IProjectCard} from '../../src/server/cards/IProjectCard';

describe('AI quick response', () => {
  it('reveals every hand card for Public Plans', () => {
    const [/* game */, player] = testGame(2);
    player.cardsInHand.push(new Tardigrades(), new Sabotage(), new PowerPlant());
    const input = cast(new PublicPlans().play(player), SelectCard);
    const response = quickResponse(input, player);
    expect(response.type).eq('card');
    expect(response.type === 'card' ? response.cards.length : 0).eq(3);
  });

  it('shows the kept and the discarded cards of a keep choice in an analysis game', () => {
    // Own game id: decision numbers are counted per game id across the whole test run
    const [/* game */, player] = testGame(2, {aiAnalysis: true}, '-keep-choice');
    const offered = [new Tardigrades(), new Sabotage(), new PowerPlant()];
    const input = cast(new ChooseCards(player, offered, {keepMax: 1}).execute(), SelectCard<IProjectCard>);
    const response = recordDecision(input, player, () => quickResponse(input, player), () => '');
    const summary = takeAiDecisionSummary();
    expect(summary?.kind).eq('keep');
    expect(summary?.options.map((option) => option.card)).has.members(offered.map((card) => card.name));
    const kept = summary?.options.filter((option) => option.chosen).map((option) => option.card);
    expect(kept).deep.eq(response.type === 'card' ? response.cards : []);
  });
});
