import {expect} from 'chai';
import {testGame} from '../TestGame';
import {clearPlayerTunings, setPlayerTuning} from '../../src/server/ai/aiTuning';
import {spaceValue} from '../../src/server/ai/spaceValue';
import {SpaceBonus} from '../../src/common/boards/SpaceBonus';

// A card space on the board counts like a drawn card with the rule, a flat 3 M€ without.
describe('AI board card bonus', () => {
  afterEach(() => clearPlayerTunings());

  it('values a card space higher with the rule early in the game', () => {
    const [game, player] = testGame(2);
    const space = game.board.getAvailableSpacesForOcean(player).find((candidate) => candidate.bonus.includes(SpaceBonus.DRAW_CARD));
    expect(space).not.to.be.undefined;
    const flat = spaceValue(space!, 'ocean', player);
    setPlayerTuning(player.id, 'boardCards1');
    expect(spaceValue(space!, 'ocean', player)).to.be.greaterThan(flat + 2);
  });
});
