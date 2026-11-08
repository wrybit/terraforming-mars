import * as path from 'path';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'fs';
import {PlayerAlias} from '../../common/admin/PlayerAliases';

// Merged player names of the statistics. A small JSON file of its own next to the database, like the imported
// games: the games themselves stay untouched, the statistics only read names over. So a merge can be undone,
// and new games under the old name count for the merged player as well.
const defaultFilename = path.resolve(process.cwd(), './db/player-aliases.json');

export class PlayerAliasesStore {
  private static instance: PlayerAliasesStore | undefined;

  constructor(private readonly filename: string = defaultFilename) {}

  public static getInstance(): PlayerAliasesStore {
    PlayerAliasesStore.instance ??= new PlayerAliasesStore();
    return PlayerAliasesStore.instance;
  }

  public static setInstanceForTesting(store: PlayerAliasesStore | undefined): void {
    PlayerAliasesStore.instance = store;
  }

  public list(): Array<PlayerAlias> {
    if (!existsSync(this.filename)) {
      return [];
    }
    return JSON.parse(readFileSync(this.filename, 'utf8'));
  }

  /** Old name → shown name; every entry points directly to its final name (no chains). */
  public targets(): Map<string, string> {
    return new Map(this.list().map((alias) => [alias.from, alias.to]));
  }

  /**
   * "from" counts as "to" from now on. Returns false for an invalid merge (empty, same name, or "to" already
   * counts as "from"). Chains are flattened: whoever counted as "from" counts as the final name directly.
   */
  public merge(from: string, to: string, nowMs: number = Date.now()): boolean {
    const aliases = this.list();
    const target = aliases.find((alias) => alias.from === to)?.to ?? to;
    if (from === '' || target === '' || from === target) {
      return false;
    }
    const remaining = aliases
      .filter((alias) => alias.from !== from)
      .map((alias) => alias.to === from ? {...alias, to: target} : alias);
    this.write([{from, to: target, createdTimeMs: nowMs}, ...remaining]);
    return true;
  }

  /** Returns false if the name was not merged. */
  public unmerge(from: string): boolean {
    const aliases = this.list();
    const remaining = aliases.filter((alias) => alias.from !== from);
    if (remaining.length === aliases.length) {
      return false;
    }
    this.write(remaining);
    return true;
  }

  private write(aliases: Array<PlayerAlias>): void {
    mkdirSync(path.dirname(this.filename), {recursive: true});
    writeFileSync(this.filename, JSON.stringify(aliases, null, 2));
  }
}
