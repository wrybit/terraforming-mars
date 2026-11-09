import * as path from 'path';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'fs';
import {PlayerAppearance} from '../../common/admin/PlayerAppearance';

// Colour and emoji per name of the statistics, chosen on the admin page "Players". A small JSON file next to the
// database like the merged names (PlayerAliasesStore.ts): the games themselves stay untouched.
const defaultFilename = path.resolve(process.cwd(), './db/player-appearances.json');

export class PlayerAppearanceStore {
  private static instance: PlayerAppearanceStore | undefined;

  constructor(private readonly filename: string = defaultFilename) {}

  public static getInstance(): PlayerAppearanceStore {
    PlayerAppearanceStore.instance ??= new PlayerAppearanceStore();
    return PlayerAppearanceStore.instance;
  }

  public list(): Array<PlayerAppearance> {
    if (!existsSync(this.filename)) {
      return [];
    }
    return JSON.parse(readFileSync(this.filename, 'utf8'));
  }

  /** Replaces the look of the name; without colour and emoji the name goes back to the default look. */
  public set(appearance: PlayerAppearance): void {
    const others = this.list().filter((entry) => entry.name !== appearance.name);
    const isDefault = appearance.color === undefined && appearance.emoji === undefined;
    this.write(isDefault ? others : [...others, appearance]);
  }

  private write(appearances: Array<PlayerAppearance>): void {
    mkdirSync(path.dirname(this.filename), {recursive: true});
    writeFileSync(this.filename, JSON.stringify(appearances, null, 2));
  }
}
