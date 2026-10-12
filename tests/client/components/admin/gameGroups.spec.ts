import {expect} from 'chai';
import {gameGroupOf, groupGames} from '@/client/components/admin/gameGroups';
import {AdminGameSummary} from '@/common/admin/AdminGameSummary';

function game(id: string, isFinished: boolean, online: Array<boolean | undefined>): AdminGameSummary {
  return {
    id, source: 'local', createdTimeMs: 0, isFinished, generation: 1,
    spectatorUrl: undefined, externalUrl: undefined, importedParticipantId: undefined, screenshotUrl: undefined,
    players: online.map((isOnline, index) => ({
      name: 'P' + index, color: 'red', url: undefined, victoryPoints: 20, megaCredits: 0, isWinner: false, corporation: undefined, isOnline,
    })),
  };
}

describe('gameGroups', () => {
  it('sorts each game into live, open or finished', () => {
    expect(gameGroupOf(game('a', false, [false, true]))).eq('live');
    expect(gameGroupOf(game('b', false, [false, undefined]))).eq('open');
    // A finished game is never live, even if a player still looks at the result
    expect(gameGroupOf(game('c', true, [true]))).eq('finished');
  });

  it('keeps the fixed group order and leaves out empty groups', () => {
    const groups = groupGames([game('f', true, [false]), game('o1', false, [false]), game('o2', false, [false])]);
    expect(groups.map((group) => [group.key, group.games.map((g) => g.id)])).deep.eq([['open', ['o1', 'o2']], ['finished', ['f']]]);
  });
});
