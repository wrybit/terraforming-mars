import {expect} from 'chai';
import {testGame} from '../TestGame';
import {setTemperature} from '../TestingUtils';
import {clearPlayerTunings, setPlayerTuning} from '../../src/server/ai/aiTuning';
import {remainingProductionPhases} from '../../src/server/ai/gameProgress';
import {lateStandardPenalty} from '../../src/server/ai/lateStandardRestraint';
import {deadCardSaleResponses, deadHandCards} from '../../src/server/ai/deadCardSale';
import {ArcticAlgae} from '../../src/server/cards/base/ArcticAlgae';
import {SolarPower} from '../../src/server/cards/base/SolarPower';

// Round 159: hand cards left over – late standard projects while cards are playable, and cards that can never
// be played again kept until the last generation.
describe('AI round 159 variants', () => {
  afterEach(() => clearPlayerTunings());

  describe('lateStandardRestraint', () => {
    it('is off in the baseline and early in the game', () => {
      const [game, player] = testGame(2);
      expect(lateStandardPenalty(player, 2)).eq(0);
      setPlayerTuning(player.id, 'lateStandardRestraint');
      game.generation = 1;
      expect(remainingProductionPhases(game, player)).to.be.greaterThan(3);
      expect(lateStandardPenalty(player, 2)).eq(0);
    });

    it('adds a share per playable hand card in the late generations, at most three', () => {
      const [game, player] = testGame(2);
      setPlayerTuning(player.id, 'lateStandardRestraint');
      let found = false;
      for (let generation = 1; generation <= 30 && !found; generation++) {
        game.generation = generation;
        const remaining = remainingProductionPhases(game, player);
        if (remaining >= 1 && remaining <= 3) {
          found = true;
          expect(lateStandardPenalty(player, 0)).eq(0);
          expect(lateStandardPenalty(player, 1)).eq(2);
          expect(lateStandardPenalty(player, 5)).eq(6);
        }
      }
      expect(found).is.true;
    });
  });

  describe('deadCardSale', () => {
    it('finds hand cards whose maximum requirement is exceeded', () => {
      const [game, player] = testGame(2);
      const algae = new ArcticAlgae();
      player.cardsInHand.push(algae, new SolarPower());
      setTemperature(game, -30);
      expect(deadHandCards(player)).is.empty;
      setTemperature(game, 0);
      expect(deadHandCards(player).map((card) => card.name)).deep.eq([algae.name]);
    });

    it('offers the sale only with the variant', () => {
      const [game, player] = testGame(2);
      const algae = new ArcticAlgae();
      player.cardsInHand.push(algae, new SolarPower());
      setTemperature(game, 0);
      expect(deadCardSaleResponses(player)).is.empty;
      setPlayerTuning(player.id, 'deadCardSale');
      expect(deadCardSaleResponses(player)).deep.eq([{type: 'card', cards: [algae.name]}]);
    });
  });
});
