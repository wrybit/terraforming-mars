import {expect} from 'chai';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {findDeletedGame, recordDeletedGames} from '../../src/server/database/deletedGamesLog';

describe('deletedGamesLog', () => {
  let previousFile: string | undefined;

  beforeEach(() => {
    previousFile = process.env.DELETED_GAMES_FILE;
    process.env.DELETED_GAMES_FILE = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'deleted-games-spec-')), 'log.jsonl');
  });

  afterEach(() => {
    process.env.DELETED_GAMES_FILE = previousFile;
  });

  it('knows nothing without a file', () => {
    expect(findDeletedGame('g123')).deep.eq({deleted: false});
  });

  it('finds a game by game, player and spectator id', () => {
    recordDeletedGames([{
      gameId: 'g123', participantIds: ['p1', 's1'], playerNames: ['Ann', 'Bo'],
      deletedAt: 1000, reason: 'deleted-in-admin-area',
    }]);
    for (const id of ['g123', 'p1', 's1']) {
      const result = findDeletedGame(id);
      expect(result.deleted).is.true;
      if (result.deleted) {
        expect(result.gameId).eq('g123');
        expect(result.playerNames).deep.eq(['Ann', 'Bo']);
        expect(result.reason).eq('deleted-in-admin-area');
      }
    }
    expect(findDeletedGame('p2')).deep.eq({deleted: false});
  });

  it('keeps the purge window of an automatic removal', () => {
    recordDeletedGames([{gameId: 'g9', participantIds: [], playerNames: [], deletedAt: 5, reason: 'purged-unfinished', maxGameDays: '7'}]);
    const result = findDeletedGame('g9');
    expect(result.deleted && result.maxGameDays).eq('7');
  });

  it('skips broken lines', () => {
    fs.writeFileSync(process.env.DELETED_GAMES_FILE!, 'not json\n');
    recordDeletedGames([{gameId: 'g1', participantIds: [], playerNames: [], deletedAt: 1, reason: 'deleted-in-admin-area'}]);
    expect(findDeletedGame('g1').deleted).is.true;
  });
});
