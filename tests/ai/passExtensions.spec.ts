import {expect} from 'chai';
import {testGame} from '../TestGame';
import {IPlayer} from '../../src/server/IPlayer';
import {passExtensionPenalty, registerPassExtension} from '../../src/server/ai/passExtensions';

// Optional modules make passing dearer when a passed player can no longer answer.
describe('AI pass extensions', () => {
  it('adds registered terms, priced with the value of a VP', () => {
    const [game, player] = testGame(2);
    const before = passExtensionPenalty(player, 7);
    registerPassExtension((candidate, victoryPoint) => candidate.game === game && candidate.id === player.id ? 3 * victoryPoint : 0);
    expect(passExtensionPenalty(player, 7)).eq(before + 21);
  });

  it('registers a term only once', () => {
    const [game, player] = testGame(2);
    const before = passExtensionPenalty(player, 1);
    const term = (candidate: IPlayer) => candidate.game === game ? 1 : 0;
    registerPassExtension(term);
    registerPassExtension(term);
    expect(passExtensionPenalty(player, 1)).eq(before + 1);
  });
});
