import {expect} from 'chai';
import {testGame} from '../TestGame';
import {clearPlayerTunings, setPlayerTuning} from '../../src/server/ai/aiTuning';
import {estimateCardValues} from '../../src/server/ai/cardValue';
import {AICentral} from '../../src/server/cards/base/AICentral';
import {Research} from '../../src/server/cards/base/Research';
import {DevelopmentCenter} from '../../src/server/cards/base/DevelopmentCenter';
import {ICard} from '../../src/server/cards/ICard';

// Jens' rule (2026-10-17): card-drawing cards are a priority, those drawing by action every generation most.
// Humans played 7.6 of them per game, the AI 1.7.
describe('AI draw priority', () => {
  afterEach(() => clearPlayerTunings());

  function value(card: ICard, tuning: string): number {
    const [game, player] = testGame(2);
    game.generation = 3;
    // Development Center spends energy on its action.
    player.production.override({energy: 2});
    setPlayerTuning(player.id, tuning);
    return estimateCardValues(player, [card]).get(card.name)!;
  }

  for (const card of [new AICentral(), new DevelopmentCenter(), new Research()]) {
    it(`values ${card.name} higher with the rule`, () => {
      // Margin below the full bonus: the later value samples random future tableaus.
      expect(value(card, 'baseline')).to.be.greaterThan(value(card, 'noDrawPriority') + 1);
    });
  }
});
