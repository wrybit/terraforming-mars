import {expect} from 'chai';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {MusicSettingsStore} from '../../src/server/admin/musicSettingsStore';
import {MUSIC_TRACKS} from '../../src/common/music/musicTracks';
import {DEFAULT_START_TRACK} from '../../src/common/music/musicState';

describe('MusicSettingsStore', () => {
  let folder: string;
  let store: MusicSettingsStore;
  const all = MUSIC_TRACKS.map((track) => track.id);

  beforeEach(() => {
    folder = fs.mkdtempSync(path.join(os.tmpdir(), 'music-'));
    store = new MusicSettingsStore(path.join(folder, 'music.json'));
  });

  afterEach(() => {
    fs.rmSync(folder, {recursive: true, force: true});
  });

  it('plays every track without a file', () => {
    expect(store.state().enabled).deep.eq(all);
  });

  it('switches a track off and on again', () => {
    expect(store.setEnabled(all[0], false)?.enabled).deep.eq(all.slice(1));
    expect(new MusicSettingsStore(path.join(folder, 'music.json')).state().enabled).deep.eq(all.slice(1));
    expect(store.setEnabled(all[0], true)?.enabled).deep.eq(all);
  });

  it('refuses unknown tracks', () => {
    expect(store.setEnabled('no-such-track', false)).is.undefined;
    expect(store.setStart('no-such-track')).is.undefined;
  });

  it('starts with the default track until the admin chooses another', () => {
    expect(store.state().start).eq(DEFAULT_START_TRACK);
    expect(store.setStart(all[1])?.start).eq(all[1]);
    store.setEnabled(all[0], false);
    expect(store.state().start).eq(all[1]);
  });

  it('plays everything when the file is broken', () => {
    fs.writeFileSync(path.join(folder, 'music.json'), '{broken');
    expect(store.state().enabled).deep.eq(all);
  });
});
