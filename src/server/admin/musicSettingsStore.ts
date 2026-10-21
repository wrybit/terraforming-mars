import * as path from 'path';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'fs';
import {MUSIC_TRACKS} from '../../common/music/musicTracks';

// Which background tracks the admin switched off. Lives in the db folder (in Docker the data volume), so the
// choice survives updates; takes effect at once, without a restart. Stored are the switched-off tracks only:
// a track added later plays right away.
const defaultFile = path.resolve(process.cwd(), './db/music.json');

type StoredMusicSettings = {disabled: Array<string>};

export class MusicSettingsStore {
  private static instance: MusicSettingsStore | undefined;

  constructor(private readonly file: string = defaultFile) {}

  public static getInstance(): MusicSettingsStore {
    MusicSettingsStore.instance ??= new MusicSettingsStore();
    return MusicSettingsStore.instance;
  }

  private disabled(): Set<string> {
    if (!existsSync(this.file)) {
      return new Set();
    }
    try {
      const stored: StoredMusicSettings = JSON.parse(readFileSync(this.file, 'utf8'));
      return new Set(Array.isArray(stored.disabled) ? stored.disabled.filter((id) => typeof id === 'string') : []);
    } catch {
      // A broken file must not silence the music for good: everything plays
      return new Set();
    }
  }

  /** Ids of the tracks that may play, in catalog order */
  public enabled(): Array<string> {
    const disabled = this.disabled();
    return MUSIC_TRACKS.map((track) => track.id).filter((id) => !disabled.has(id));
  }

  /** Switches one track on or off; returns the enabled ids. Unknown ids are refused (undefined). */
  public setEnabled(id: string, enabled: boolean): Array<string> | undefined {
    if (!MUSIC_TRACKS.some((track) => track.id === id)) {
      return undefined;
    }
    const disabled = this.disabled();
    if (enabled) {
      disabled.delete(id);
    } else {
      disabled.add(id);
    }
    mkdirSync(path.dirname(this.file), {recursive: true});
    const stored: StoredMusicSettings = {disabled: [...disabled]};
    writeFileSync(this.file, JSON.stringify(stored, null, 2));
    return this.enabled();
  }
}
