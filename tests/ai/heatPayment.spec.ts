import {expect} from 'chai';
import {testGame} from '../TestGame';
import {StormCraftIncorporated} from '../../src/server/cards/colonies/StormCraftIncorporated';
import {quickResponse} from '../../src/server/ai/quickResponse';
import {TestPlayer} from '../TestPlayer';

describe('AI heat payment with Stormcraft', () => {
  let card: StormCraftIncorporated;
  let player: TestPlayer;

  beforeEach(() => {
    card = new StormCraftIncorporated();
    [/* game */, player] = testGame(2);
    player.playedCards.push(card);
  });

  // Each amount at its maximum overspent heat and the move failed (seen in test games against the Rust AI).
  const cases: Array<[number, number, number, number, number]> = [
    // target, heat, floaters → heat left, floaters left
    [8, 10, 3, 8, 0],
    [8, 10, 10, 10, 6],
    [8, 4, 2, 0, 0],
    [5, 10, 10, 10, 7],
    [5, 0, 3, 0, 0],
    [6, 6, 0, 0, 0],
  ];
  for (const [target, heat, floaters, heatLeft, floatersLeft] of cases) {
    it(`pays ${target} heat from ${heat} heat and ${floaters} floaters`, () => {
      player.heat = heat;
      card.resourceCount = floaters;
      const input = card.spendHeat(player, target);
      expect(() => input.process(quickResponse(input, player) as any, player)).not.to.throw();
      expect(player.heat).eq(heatLeft);
      expect(card.resourceCount).eq(floatersLeft);
    });
  }
});
