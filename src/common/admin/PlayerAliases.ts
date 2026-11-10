import {Color} from '../Color';
import {PlayerAppearance} from './PlayerAppearance';

// Contract between the admin page "Players" (client) and its API (server): both sides read and write exactly this shape.

/** A name in the statistics that counts as another one: "from" is shown and counted as "to". */
export type PlayerAlias = {
  id: string;
  from: string;
  to: string;
  createdTimeMs: number;
  /**
   * Only these games (StatsGame summary ids): a one-time merge of the games played so far. Default names
   * ("Blue", a Dune name …) belong to whoever left the name empty, so a later player with the same name stays
   * apart. Missing: permanent, also for future games.
   */
  gameIds?: Array<string>;
};

export type AdminPlayerAliasesInfo = {
  aliases: Array<PlayerAlias>;
  /** Names the game gives to seats left empty, in every language: merged only one-time by default. */
  defaultNames: Array<string>;
  /** Colour and emoji the admin chose per name (PlayerAppearance.ts). */
  appearances: Array<PlayerAppearance>;
};

export type AdminPlayerAliasRequest =
  {action: 'merge', from: string, to: string, permanent: boolean} |
  {action: 'unmerge', id: string} |
  /** Both missing: back to the default look. */
  {action: 'appearance', name: string, color?: Color, emoji?: string};
