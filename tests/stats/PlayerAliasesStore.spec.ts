import {expect} from 'chai';
import * as os from 'os';
import * as path from 'path';
import {mkdtempSync, rmSync} from 'fs';
import {PlayerAliasesStore} from '../../src/server/stats/PlayerAliasesStore';

describe('PlayerAliasesStore', () => {
  let folder: string;
  let store: PlayerAliasesStore;
  const pairs = () => store.list().map((alias) => `${alias.from}→${alias.to}${alias.gameIds === undefined ? '' : ` [${alias.gameIds.join(',')}]`}`);

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
    expect(store.merge('jens', 'Jens', undefined, 5)).is.true;
    const [alias] = new PlayerAliasesStore(path.join(folder, 'player-aliases.json')).list();
    expect(alias).deep.include({from: 'jens', to: 'Jens', createdTimeMs: 5});
    expect(alias.gameIds).is.undefined;
  });

  it('refuses empty and identical names and one-time merges without games', () => {
    expect(store.merge('', 'Jens', undefined)).is.false;
    expect(store.merge('Jens', 'Jens', undefined)).is.false;
    expect(store.merge('Blue', 'Jens', [])).is.false;
    expect(store.list()).deep.eq([]);
  });

  it('flattens chains in both directions', () => {
    store.merge('Jens H.', 'jens', undefined);
    store.merge('jens', 'Jens', undefined);
    expect(pairs()).deep.eq(['jens→Jens', 'Jens H.→Jens']);
    // Target is itself an old name: points to its final name
    store.merge('J.', 'jens', undefined);
    expect(pairs()[0]).eq('J.→Jens');
  });

  it('refuses a merge back onto the old name', () => {
    store.merge('jens', 'Jens', undefined);
    expect(store.merge('Jens', 'jens', undefined)).is.false;
  });

  it('keeps several one-time merges of the same default name', () => {
    store.merge('Blue', 'Jens', ['g1']);
    store.merge('Blue', 'Anna', ['g2']);
    expect(pairs()).deep.eq(['Blue→Anna [g2]', 'Blue→Jens [g1]']);
  });

  it('unmerges by id', () => {
    store.merge('Blue', 'Jens', ['g1']);
    store.merge('Blue', 'Anna', ['g2']);
    const [anna] = store.list();
    expect(store.unmerge(anna.id)).is.true;
    expect(store.unmerge(anna.id)).is.false;
    expect(pairs()).deep.eq(['Blue→Jens [g1]']);
  });
});
