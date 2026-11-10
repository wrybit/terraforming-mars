import {Color} from '@/common/Color';
import {StatsGame} from '@/common/stats/StatsGame';
import {PlayerAlias} from '@/common/admin/PlayerAliases';
import {botAccountOf} from '@/common/ai/botAccounts';
import {PlayerAppearance} from '@/common/admin/PlayerAppearance';

/** A name as the statistics show it (old names already merged), with what the admin needs to decide a merge. */
export type PlayerNameStats = {
  name: string;
  /** Colour chosen by the admin, else of the latest game (AI accounts: fixed): makes the same person easy to recognise. */
  color: Color;
  /** Emoji chosen by the admin (AI accounts: the robot by default); missing: the initial. */
  emoji?: string;
  games: number;
  wins: number;
  lastTimeMs: number;
  /** Old names that count as this name. */
  oldNames: Array<string>;
  /** Account of all AI players of one strength ("Bot [AI+]"): merged automatically, never by hand. */
  isBot: boolean;
};

const BOT_EMOJI = '🤖';

/** All names of the statistics games, most games first. */
export function playerNameStats(games: ReadonlyArray<StatsGame>, aliases: ReadonlyArray<PlayerAlias>,
  appearances: ReadonlyArray<PlayerAppearance> = []): Array<PlayerNameStats> {
  // Names AI players were merged into by hand (before the automatic merge existed) belong to that strength's account too
  const mergedBots = new Map(aliases.flatMap((alias) => {
    const bot = botAccountOf(alias.from);
    return bot === undefined ? [] : [[alias.to, bot] as const];
  }));
  const byName = new Map<string, PlayerNameStats>();
  for (const game of games) {
    const timeMs = game.summary.createdTimeMs;
    // Two AI players of the same strength in one game are one game of their account, not two
    const counted = new Set<string>();
    for (const player of game.summary.players) {
      const bot = botAccountOf(player.name) ?? mergedBots.get(player.name);
      const name = bot?.name ?? player.name;
      const entry = byName.get(name) ?? {name, color: player.color, emoji: bot === undefined ? undefined : BOT_EMOJI, games: 0, wins: 0, lastTimeMs: 0, oldNames: [], isBot: bot !== undefined};
      if (!counted.has(name)) {
        counted.add(name);
        entry.games++;
      }
      entry.wins += player.isWinner ? 1 : 0;
      if (timeMs >= entry.lastTimeMs) {
        entry.lastTimeMs = timeMs;
        entry.color = bot?.color ?? player.color;
      }
      byName.set(name, entry);
    }
  }
  for (const alias of aliases) {
    // AI names are not listed: there are many, and the account says what counts
    if (botAccountOf(alias.from) === undefined) {
      byName.get(alias.to)?.oldNames.push(alias.from);
    }
  }
  for (const appearance of appearances) {
    const entry = byName.get(appearance.name);
    if (entry !== undefined) {
      entry.color = appearance.color ?? entry.color;
      entry.emoji = appearance.emoji ?? entry.emoji;
    }
  }
  return [...byName.values()].sort((first, second) => second.games - first.games || first.name.localeCompare(second.name));
}

/** Games both names played in: after a merge the player counts twice there. */
export function sharedGameCount(games: ReadonlyArray<StatsGame>, first: string, second: string): number {
  return games.filter((game) => {
    const names = game.summary.players.map((player) => player.name);
    return names.includes(first) && names.includes(second);
  }).length;
}
