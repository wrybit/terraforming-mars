import {expect} from 'chai';
import * as os from 'os';
import * as path from 'path';
import {mkdtempSync, rmSync} from 'fs';
import {ImportedGamesStore} from '../../src/server/admin/ImportedGamesStore';
import {AdminGameSummary} from '../../src/common/admin/AdminGameSummary';

describe('ImportedGamesStore', () => {
  let folder: string;
  let store: ImportedGamesStore;
  const summary = (id: string) => ({id, source: 'imported', createdTimeMs: 1, isFinished: true, generation: 1, spectatorUrl: undefined, externalUrl: 'x', importedParticipantId: undefined, players: []}) as AdminGameSummary;

  beforeEach(() => {
    folder = mkdtempSync(path.join(os.tmpdir(), 'imported-games-'));
    store = new ImportedGamesStore(path.join(folder, 'db', 'imported-games.json'));
  });

  afterEach(() => {
    rmSync(folder, {recursive: true, force: true});
  });

  it('starts empty, adds and removes', () => {
    expect(store.list()).deep.eq([]);
    store.add(summary('a'));
    store.add(summary('b'));
    expect(store.has('a')).is.true;
    expect(store.remove('a')).is.true;
    expect(store.remove('a')).is.false;
    expect(store.list().map((s) => s.id)).deep.eq(['b']);
  });
});
