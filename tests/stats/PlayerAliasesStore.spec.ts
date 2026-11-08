import {expect} from 'chai';
import * as os from 'os';
import * as path from 'path';
import {mkdtempSync, rmSync} from 'fs';
import {PlayerAliasesStore} from '../../src/server/stats/PlayerAliasesStore';

describe('PlayerAliasesStore', () => {
  let folder: string;
  let store: PlayerAliasesStore;

  beforeEach(() => {
    folder = mkdtempSync(path.join(os.tmpdir(), 'player-aliases-'));
    store = new PlayerAliasesStore(path.join(folder, 'player-aliases.json'));
  });

  afterEach(() => {
    rmSync(folder, {recursive: true, force: true});
  });

  it('is empty without a file', () => {
    expect(store.list()).deep.eq([]);
  });

  it('merges and keeps the merge in the file', () => {
    expect(store.merge('jens', 'Jens', 5)).is.true;
    expect(new PlayerAliasesStore(path.join(folder, 'player-aliases.json')).list()).deep.eq([{from: 'jens', to: 'Jens', createdTimeMs: 5}]);
  });

  it('refuses empty and identical names', () => {
    expect(store.merge('', 'Jens')).is.false;
    expect(store.merge('Jens', 'Jens')).is.false;
    expect(store.list()).deep.eq([]);
  });

  it('flattens chains in both directions', () => {
    store.merge('Jens H.', 'jens');
    store.merge('jens', 'Jens');
    expect(store.targets()).deep.eq(new Map([['jens', 'Jens'], ['Jens H.', 'Jens']]));
    // Target is itself an old name: points to its final name
    store.merge('J.', 'jens');
    expect(store.targets().get('J.')).eq('Jens');
  });

  it('refuses a merge back onto the old name', () => {
    store.merge('jens', 'Jens');
    expect(store.merge('Jens', 'jens')).is.false;
  });

  it('unmerges', () => {
    store.merge('jens', 'Jens');
    expect(store.unmerge('jens')).is.true;
    expect(store.unmerge('jens')).is.false;
    expect(store.list()).deep.eq([]);
  });
});
