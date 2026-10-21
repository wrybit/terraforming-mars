import * as path from 'path';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'fs';
import {MUSIC_TRACKS} from '../../common/music/musicTracks';
import {DEFAULT_START_TRACK, MusicState} from '../../common/music/musicState';

// Which background tracks the admin switched off. Lives in the db folder (in Docker the data volume), so the
// choice survives updates; takes effect at once, without a restart. Stored are the switched-off tracks only:
// a track added later plays right away.
const defaultFile = path.resolve(process.cwd(), './db/music.json');

type StoredMusicSettings = {disabled: Array<string>, start?: string};

export class MusicSettingsStore {
  private static instance: MusicSettingsStore | undefined;

  constructor(private readonly file: string = defaultFile) {}

  public static getInstance(): MusicSettingsStore {
    MusicSettingsStore.instance ??= new MusicSettingsStore();
    return MusicSettingsStore.instance;
  }

  private read(): StoredMusicSettings {
    if (!existsSync(this.file)) {
      return {disabled: []};
    }
    try {
      const stored: StoredMusicSettings = JSON.parse(readFileSync(this.file, 'utf8'));
      return {
        disabled: Array.isArray(stored.disabled) ? stored.disabled.filter((id) => typeof id === 'string') : [],
        start: typeof stored.start === 'string' ? stored.start : undefined,
      };
    } catch {
      // A broken file must not silence the music for good: everything plays
      return {disabled: []};
    }
  }

  private write(settings: StoredMusicSettings): void {
    mkdirSync(path.dirname(this.file), {recursive: true});
    writeFileSync(this.file, JSON.stringify(settings, null, 2));
  }

  /** Enabled tracks in catalog order and the start track (a known one, else the default) */
  public state(): MusicState {
    const stored = this.read();
    const disabled = new Set(stored.disabled);
    const known = stored.start !== undefined && MUSIC_TRACKS.some((track) => track.id === stored.start);
    return {
      enabled: MUSIC_TRACKS.map((track) => track.id).filter((id) => !disabled.has(id)),
      start: known ? stored.start as string : DEFAULT_START_TRACK,
    };
  }

  /** Switches one track on or off; undefined for unknown ids */
  public setEnabled(id: string, enabled: boolean): MusicState | undefined {
    if (!MUSIC_TRACKS.some((track) => track.id === id)) {
      return undefined;
    }
    const stored = this.read();
    const disabled = new Set(stored.disabled);
    if (enabled) {
      disabled.delete(id);
    } else {
      disabled.add(id);
    }
    this.write({...stored, disabled: [...disabled]});
    return this.state();
  }

  /** Chooses the track games start with; undefined for unknown ids */
  public setStart(id: string): MusicState | undefined {
    if (!MUSIC_TRACKS.some((track) => track.id === id)) {
      return undefined;
    }
    this.write({...this.read(), start: id});
    return this.state();
  }
}
