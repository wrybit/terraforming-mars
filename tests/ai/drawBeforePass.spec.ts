import {expect} from 'chai';
import {testGame} from '../TestGame';
import {clearPlayerTunings, setPlayerTuning} from '../../src/server/ai/aiTuning';
import {drawBeforePassPenalty} from '../../src/server/ai/drawBeforePass';
import {DevelopmentCenter} from '../../src/server/cards/base/DevelopmentCenter';
import {OrOptions} from '../../src/server/inputs/OrOptions';
import {InputResponse} from '../../src/common/inputs/InputResponse';
import {CardName} from '../../src/common/cards/CardName';
import {Phase} from '../../src/common/Phase';

// Round 200: passing while a draw action is still open gives up its cards.
describe('AI draw before pass', () => {
  afterEach(() => clearPlayerTunings());

  it('makes passing cost the cards an open draw action would draw', () => {
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
    const action: InputResponse = {type: 'or', index, response: {type: 'card', cards: [CardName.DEVELOPMENT_CENTER]}};
    const other: InputResponse = {type: 'or', index: index === 0 ? 1 : 0, response: {type: 'option'}};
    expect(drawBeforePassPenalty(player, menu, [action, other])).eq(0);
    setPlayerTuning(player.id, 'drawBeforePass1');
    const full = drawBeforePassPenalty(player, menu, [action, other]);
    expect(full).to.be.greaterThan(0);
    expect(drawBeforePassPenalty(player, menu, [other])).eq(0);
    setPlayerTuning(player.id, 'drawBeforePass05');
    expect(drawBeforePassPenalty(player, menu, [action, other])).closeTo(full / 2, 1e-9);
  });
});
