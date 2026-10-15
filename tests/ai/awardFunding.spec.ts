import {expect} from 'chai';
import {testGame} from '../TestGame';
import {fundingAllowed, leadsAward} from '../../src/server/ai/awardFunding';
import {OrOptions} from '../../src/server/inputs/OrOptions';
import {SelectOption} from '../../src/server/inputs/SelectOption';
import {message} from '../../src/server/logs/MessageBuilder';
import {clearPlayerTunings, setPlayerTuning} from '../../src/server/ai/aiTuning';

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

  it('gates only free funding', () => {
    const [, player] = testGame(2);
    const menu = (cost: number) => {
      const awards = new OrOptions(new SelectOption('Thermalist')).setTitle(message('Fund an award (${0} M€)', (b) => b.number(cost)));
      return awards;
    };
    expect(fundingAllowed(menu(8), {type: 'or', index: 0, response: {type: 'option'}}, player)).is.true;
    expect(fundingAllowed(menu(0), {type: 'or', index: 0, response: {type: 'option'}}, player)).is.false;
  });
});
