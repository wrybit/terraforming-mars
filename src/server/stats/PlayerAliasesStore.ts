import * as path from 'path';
import {randomBytes} from 'crypto';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'fs';
import {PlayerAlias} from '../../common/admin/PlayerAliases';
import {aiMarkerOf} from '../../common/ai/AiLevel';

// Merged player names of the statistics. A small JSON file of its own next to the database, like the imported
// games: the games themselves stay untouched, the statistics only read names over. So a merge can be undone.
// A permanent merge also covers future games under the old name; a one-time merge only the games it lists.
const defaultFilename = path.resolve(process.cwd(), './db/player-aliases.json');

const isPermanent = (alias: PlayerAlias) => alias.gameIds === undefined;

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

  /**
   * "from" counts as "to" from now on – everywhere (gameIds missing) or only in the given games. Returns false for
   * an invalid merge (empty, same name, no games, or "to" already counts as "from"). Chains are flattened:
   * whoever counted as "from" counts as the final name directly. AI names never: they count per strength
   * as "Bot [AI…]" automatically (botAccounts.ts).
   */
  public merge(from: string, to: string, gameIds: ReadonlyArray<string> | undefined, nowMs: number = Date.now()): boolean {
    const aliases = this.list();
    // Only a permanent merge renames a name everywhere; a one-time one does not make "to" someone else
    const target = aliases.find((alias) => isPermanent(alias) && alias.from === to)?.to ?? to;
    if (from === '' || target === '' || from === target || gameIds?.length === 0 || aiMarkerOf(from) !== undefined || aiMarkerOf(target) !== undefined) {
      return false;
    }
    const remaining = aliases
      // A new permanent merge replaces the old permanent one of the same name; one-time merges stay
      .filter((alias) => gameIds !== undefined || !isPermanent(alias) || alias.from !== from)
      .map((alias) => alias.to === from ? {...alias, to: target} : alias);
    const alias: PlayerAlias = {id: randomBytes(6).toString('hex'), from, to: target, createdTimeMs: nowMs};
    if (gameIds !== undefined) {
      alias.gameIds = [...gameIds];
    }
    this.write([alias, ...remaining]);
    return true;
  }

  /** Returns false if there was no merge with this id. */
  public unmerge(id: string): boolean {
    const aliases = this.list();
    const remaining = aliases.filter((alias) => alias.id !== id);
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
