import {expect} from 'chai';
import {testGame} from '../TestGame';
import {leadsAward} from '../../src/server/ai/awardFunding';
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
    expect(leadsAward(player, 'Thermalist')).is.true;
  });
});
