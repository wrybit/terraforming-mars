import {expect} from 'chai';
import {startThinking, stopThinking, thinkingIn} from '../../src/server/ai/aiThinking';
import {SelectOption} from '../../src/server/inputs/SelectOption';
import {testGame} from '../TestGame';

describe('aiThinking', () => {
  it('keeps the line of the next decision when the previous move ends', () => {
    // Several AI moves in a row: the next decision starts while the previous move is still being processed
    const [game, player] = testGame(2);
    const first = new SelectOption('first');
    const next = new SelectOption('next');
    startThinking(player, first, 3000);
    startThinking(player, next, 3000);
    stopThinking(player, first);
    expect(thinkingIn(game.id)).has.length(1);
    stopThinking(player, next);
    expect(thinkingIn(game.id)).has.length(0);
  });

  it('reports the time left', () => {
    const [game, player] = testGame(2);
    startThinking(player, new SelectOption('move'), 2000);
    const [entry] = thinkingIn(game.id);
    expect(entry.color).eq(player.color);
    expect(entry.remainingMs).within(1900, 2000);
  });
});
