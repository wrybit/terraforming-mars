import {expect} from 'chai';
import {testGame} from '../TestGame';
import {clearPlayerTunings, setPlayerTuning} from '../../src/server/ai/aiTuning';
import {milestoneReservePenalty} from '../../src/server/ai/milestoneReserve';
import {earlyCollectorPoints} from '../../src/server/ai/vpResourceEngine';
import {Birds} from '../../src/server/cards/base/Birds';

describe('AI round 153 variants', () => {
  afterEach(() => clearPlayerTunings());

  // Humans claim 2.2 milestones per game against the AI, the AI 0.8: keep the claim money once a milestone is near.
  describe('milestoneReserve', () => {
    it('lowers a position with a milestone one step away and less than the claim cost', () => {
      const [, player] = testGame(2);
      // Planner needs 16 cards in hand: 15 is one step away.
      for (let i = 0; i < 15; i++) {
        player.cardsInHand.push(new Birds());
      }
      player.megaCredits = 5;
      expect(milestoneReservePenalty(player)).eq(0);
      setPlayerTuning(player.id, 'milestoneReserve');
      expect(milestoneReservePenalty(player)).to.be.greaterThan(0);
      player.megaCredits = 10;
      expect(milestoneReservePenalty(player)).eq(0);
    });
  });

  // Card VP of humans against the AI: 20 : 69 and 52 : 64 – early collectors gather for many generations.
  describe('vpResourceEngine', () => {
    it('adds points for an early collector only and leaves the late game alone', () => {
      const [, player] = testGame(2);
      expect(earlyCollectorPoints(player, 1, 1, 10)).eq(0);
      setPlayerTuning(player.id, 'vpResourceEngine');
      expect(earlyCollectorPoints(player, 1, 1, 10)).to.be.greaterThan(0);
      expect(earlyCollectorPoints(player, 1, 1, 3)).eq(0);
      expect(earlyCollectorPoints(player, 0, 1, 10)).eq(0);
    });
  });
});
