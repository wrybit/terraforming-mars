import {expect} from 'chai';
import {testGame} from '../TestGame';
import {fundingAllowed, leadsAward} from '../../src/server/ai/awardFunding';
import {OrOptions} from '../../src/server/inputs/OrOptions';
import {SelectOption} from '../../src/server/inputs/SelectOption';
import {message} from '../../src/server/logs/MessageBuilder';
import {clearPlayerTunings, setPlayerTuning} from '../../src/server/ai/aiTuning';
import {Research} from '../../src/server/cards/base/Research';
import {SearchForLife} from '../../src/server/cards/base/SearchForLife';
import {PhysicsComplex} from '../../src/server/cards/base/PhysicsComplex';
import {setOxygenLevel, setTemperature} from '../TestingUtils';

describe('AI award funding', () => {
  afterEach(() => clearPlayerTunings());

  it('funds only awards it leads', () => {
    const [game, player, opponent] = testGame(2);
    setPlayerTuning(player.id, 'awardLead');
    expect(game.awards.map((award) => award.name)).includes('Thermalist');
    expect(leadsAward(player, 'Thermalist')).is.false;
    player.heat = 6;
    opponent.heat = 1;
    expect(leadsAward(player, 'Thermalist')).is.true;
  });

  it('keeps every award open without the variant', () => {
    const [, player] = testGame(2);
    setPlayerTuning(player.id, 'noAwardLead');
    expect(leadsAward(player, 'Thermalist')).is.true;
  });

  it('gates free funding without a lead (paid early funding has its own rule)', () => {
    const [, player] = testGame(2);
    setPlayerTuning(player.id, 'noAwardPaidEarly');
    const menu = (cost: number) => {
      const awards = new OrOptions(new SelectOption('Thermalist')).setTitle(message('Fund an award (${0} M€)', (b) => b.number(cost)));
      return awards;
    };
    expect(fundingAllowed(menu(8), {type: 'or', index: 0, response: {type: 'option'}}, player)).is.true;
    expect(fundingAllowed(menu(0), {type: 'or', index: 0, response: {type: 'option'}}, player)).is.false;
  });

  // Human game: paid funding of a tag award at 0 : 0 in generation 1 with money and matching cards in hand.
  describe('paid funding early (awardPaidEarly)', () => {
    const scientist = (cost: number) =>
      new OrOptions(new SelectOption('Scientist')).setTitle(message('Fund an award (${0} M€)', (b) => b.number(cost)));
    const fund = {type: 'or' as const, index: 0, response: {type: 'option' as const}};

    it('blocks paid funding without a lead while a lead counts nothing', () => {
      const [, player] = testGame(2);
      setPlayerTuning(player.id, 'awardPaidEarly');
      player.megaCredits = 30;
      player.cardsInHand.push(new Research(), new SearchForLife(), new PhysicsComplex());
      expect(fundingAllowed(scientist(8), fund, player)).is.false;
    });

    it('allows it with a lead', () => {
      const [, player] = testGame(2);
      setPlayerTuning(player.id, 'awardPaidEarly');
      player.playedCards.push(new Research());
      expect(fundingAllowed(scientist(8), fund, player)).is.true;
    });

    it('allows it once a lead counts (after half the terraforming)', () => {
      const [game, player] = testGame(2);
      setPlayerTuning(player.id, 'awardPaidEarly');
      setTemperature(game, 8);
      setOxygenLevel(game, 14);
      expect(fundingAllowed(scientist(8), fund, player)).is.true;
    });

    it('keeps the old behaviour without the rule', () => {
      const [, player] = testGame(2);
      setPlayerTuning(player.id, 'noAwardPaidEarly');
      expect(fundingAllowed(scientist(8), fund, player)).is.true;
    });
  });
});
