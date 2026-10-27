import {expect} from 'chai';
import {testGame} from '../TestGame';
import {clearPlayerTunings, setPlayerTuning} from '../../src/server/ai/aiTuning';
import {milestoneDenialPoints} from '../../src/server/ai/milestoneDenial';
import {preludeIncomePenalty} from '../../src/server/ai/preludeIncomeFloor';
import {fundingAllowed} from '../../src/server/ai/awardFunding';
import {OrOptions} from '../../src/server/inputs/OrOptions';
import {SelectOption} from '../../src/server/inputs/SelectOption';
import {message} from '../../src/server/logs/MessageBuilder';
import {Research} from '../../src/server/cards/base/Research';
import {CrediCor} from '../../src/server/cards/corporation/CrediCor';
import {BiosphereSupport} from '../../src/server/cards/prelude/BiosphereSupport';
import {PolarIndustries} from '../../src/server/cards/prelude/PolarIndustries';
import {BusinessEmpire} from '../../src/server/cards/prelude/BusinessEmpire';
import {Donation} from '../../src/server/cards/prelude/Donation';
import {IPlayer} from '../../src/server/IPlayer';

// Round 147: three variants from the human games of 24.–26.10.
describe('AI round 147 variants', () => {
  afterEach(() => clearPlayerTunings());

  function fillHand(player: IPlayer, count: number) {
    for (let index = 0; index < count; index++) {
      player.cardsInHand.push(new Research());
    }
  }

  // A claimable Planner was put off for another move and the opponent claimed it.
  describe('milestoneDenial', () => {
    it('counts the risk of a claimable milestone an opponent is about to reach', () => {
      const [game, player, opponent] = testGame(2);
      expect(game.milestones.map((milestone) => milestone.name)).includes('Planner');
      fillHand(player, 16);
      fillHand(opponent, 15);
      expect(milestoneDenialPoints(player)).eq(0);
      setPlayerTuning(player.id, 'milestoneDenial');
      expect(milestoneDenialPoints(player)).eq(-5);
    });

    it('sees no risk when the opponent is far away or the milestone is claimed', () => {
      const [game, player, opponent] = testGame(2);
      setPlayerTuning(player.id, 'milestoneDenial');
      fillHand(player, 16);
      fillHand(opponent, 5);
      expect(milestoneDenialPoints(player)).eq(0);
      fillHand(opponent, 10);
      expect(milestoneDenialPoints(player)).eq(-5);
      const planner = game.milestones.find((milestone) => milestone.name === 'Planner')!;
      game.claimedMilestones.push({player, milestone: planner});
      expect(milestoneDenialPoints(player)).eq(0);
    });
  });

  // Preludes with −1 M€ production kept the AI at 1 M€ production or less until generation 5.
  describe('preludeIncomeFloor', () => {
    it('lowers an opening that leaves the M€ production below 1', () => {
      const [, player] = testGame(2);
      const corporation = new CrediCor();
      const poor = [new BiosphereSupport(), new PolarIndustries()];
      const rich = [new BusinessEmpire(), new Donation()];
      // Round 147: adopted in the baseline; the check variant switches it off.
      expect(preludeIncomePenalty(player, corporation, poor)).to.be.greaterThan(0);
      setPlayerTuning(player.id, 'noPreludeIncomeFloor');
      expect(preludeIncomePenalty(player, corporation, poor)).eq(0);
      setPlayerTuning(player.id, 'preludeIncomeFloor');
      expect(preludeIncomePenalty(player, corporation, rich)).eq(0);
    });
  });

  // Self-funded awards lost by narrow margins (6 : 7, 9 : 12, 15 : 21).
  describe('awardFundMargin', () => {
    const thermalist = new OrOptions(new SelectOption('Thermalist')).setTitle(message('Fund an award (${0} M€)', (b) => b.number(8)));
    const fund = {type: 'or' as const, index: 0, response: {type: 'option' as const}};

    it('blocks paid funding with a lead the opponent can still catch up', () => {
      const [, player, opponent] = testGame(2);
      player.heat = 10;
      opponent.heat = 9;
      expect(fundingAllowed(thermalist, fund, player)).is.true;
      setPlayerTuning(player.id, 'awardFundMargin');
      expect(fundingAllowed(thermalist, fund, player)).is.false;
    });

    it('allows it with a clear lead', () => {
      const [, player, opponent] = testGame(2);
      setPlayerTuning(player.id, 'awardFundMargin');
      player.heat = 40;
      opponent.heat = 9;
      expect(fundingAllowed(thermalist, fund, player)).is.true;
    });
  });
});
