import {expect} from 'chai';
import {testGame} from '../TestGame';
import {clearPlayerTunings, setPlayerTuning} from '../../src/server/ai/aiTuning';
import {drawnCardValue} from '../../src/server/ai/drawPriority';
import {productionPhasesWithFloor} from '../../src/server/ai/lateProductionFloor';
import {cardsDrawnByMove, spareMoneyDrawBonus} from '../../src/server/ai/spareMoneyDraw';
import {DevelopmentCenter} from '../../src/server/cards/base/DevelopmentCenter';
import {OrOptions} from '../../src/server/inputs/OrOptions';
import {Phase} from '../../src/common/Phase';
import {CardName} from '../../src/common/cards/CardName';
import {InputResponse} from '../../src/common/inputs/InputResponse';
import {Resource} from '../../src/common/Resource';

// Round 155 – the 60-card gap: humans draw 28.9 cards per game outside the research phase, the AI 8.1, and lay
// 5–8 cards per generation from generation 7 on (AI 3.6–4.1); the AI's late income stops growing.
describe('AI round 155 variants', () => {
  afterEach(() => clearPlayerTunings());

  it('lateDrawFloor lifts the late value of a drawn card with a large income', () => {
    const [, player] = testGame(2);
    player.terraformRating = 30;
    player.production.add(Resource.MEGACREDITS, 30);
    expect(drawnCardValue(player, 0)).eq(2);
    setPlayerTuning(player.id, 'lateDrawFloor');
    expect(drawnCardValue(player, 0)).eq(4);
  });

  it('lateProductionFloor keeps three production phases until generation 10', () => {
    const [, player] = testGame(2);
    expect(productionPhasesWithFloor(player, 8, 1)).eq(1);
    setPlayerTuning(player.id, 'lateProductionFloor');
    expect(productionPhasesWithFloor(player, 8, 1)).eq(3);
    expect(productionPhasesWithFloor(player, 11, 1)).eq(1);
    expect(productionPhasesWithFloor(player, 8, 5)).eq(5);
  });

  it('spareMoneyDraw rewards a draw action only when no hand card can be played', () => {
    const [game, player] = testGame(2);
    player.playedCards.push(new DevelopmentCenter());
    player.energy = 1;
    game.generation = 5;
    game.phase = Phase.ACTION;
    player.takeAction();
    const menu = player.getWaitingFor() as OrOptions;
    const index = menu.options.findIndex((option) => {
      const title = typeof option.title === 'string' ? option.title : option.title.message;
      return title === 'Perform an action from a played card';
    });
    expect(index).to.be.greaterThanOrEqual(0);
    const action: InputResponse = {type: 'or', index, response: {type: 'card', cards: [CardName.DEVELOPMENT_CENTER]}};
    expect(cardsDrawnByMove(player, menu, action)).eq(1);
    expect(spareMoneyDrawBonus(player, menu, action, false)).eq(0);
    setPlayerTuning(player.id, 'spareMoneyDraw');
    expect(spareMoneyDrawBonus(player, menu, action, false)).to.be.greaterThan(0);
    expect(spareMoneyDrawBonus(player, menu, action, true)).eq(0);
  });
});
