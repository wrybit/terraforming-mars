// Server settings that can be changed on the admin page instead of editing the .env file by hand.
// One list for both sides: the server only accepts these keys (serverSettingsFile.ts), the page shows them
// in this order and grouping (ServerSettingsPanel.vue).

export type ServerSettingKind = 'text' | 'number' | 'secret' | 'toggle';

export type ServerSettingGroup = 'Appearance' | 'Games' | 'Limits' | 'AI opponents' | 'Access' | 'Technical';

export type ServerSettingDefinition = {
  key: string,
  group: ServerSettingGroup,
  kind: ServerSettingKind,
  label: string,
  description: string,
};

export const SERVER_SETTING_GROUPS: ReadonlyArray<ServerSettingGroup> = ['Appearance', 'Games', 'Limits', 'AI opponents', 'Access', 'Technical'];

export const SERVER_SETTINGS: ReadonlyArray<ServerSettingDefinition> = [
  {key: 'SERVER_NAME', group: 'Appearance', kind: 'text', label: 'Server name',
    description: 'Shown in white under the title on the start page. Empty: nothing is shown.'},
  {key: 'TITLE_LONG', group: 'Appearance', kind: 'text', label: 'Long tab title',
    description: 'Browser tab of the start page. Empty: Terraforming Mars.'},
  {key: 'TITLE_SHORT', group: 'Appearance', kind: 'text', label: 'Short tab title',
    description: 'End of all other tab titles, e.g. "Cards List | TM". Empty: TM.'},

  {key: 'MAX_GAME_DAYS', group: 'Games', kind: 'number', label: 'Delete unfinished games after (days)',
    description: 'Unfinished games created more than this many days ago are deleted (checked every hour). Finished games are never deleted. Empty: never (with PostgreSQL: 10 days).'},
  {key: 'COMPRESS_COMPLETED_GAMES_DAYS', group: 'Games', kind: 'number', label: 'Shrink finished games after (days)',
    description: 'Finished games keep only their final state after this many days (about 18 MB → 0.1 MB); the states of the single moves are lost. Empty: never.'},
  {key: 'WAITING_FOR_TIMEOUT', group: 'Games', kind: 'number', label: 'Waiting check interval (ms)',
    description: 'How often a waiting player asks whether it is their turn again. Empty: 5000.'},
  {key: 'GAME_CACHE', group: 'Games', kind: 'text', label: 'Game memory',
    description: 'When games are removed from memory, e.g. sweep=auto;eviction_age=15m;idle_age=1h;sweep_freq=5m. Empty: never.'},

  {key: 'GAME_QUOTA', group: 'Limits', kind: 'text', label: 'New games per address',
    description: 'How many games one address may create, e.g. {"limit":3,"per":"10m"} or a list of such limits. Empty: unlimited.'},
  {key: 'MIN_RESPONSE_INTERVAL_MS', group: 'Limits', kind: 'number', label: 'Minimum time between inputs (ms)',
    description: 'Faster inputs of a player are refused (against bots). Empty or 0: no limit.'},
  {key: 'IP_BLOCKLIST', group: 'Limits', kind: 'text', label: 'Blocked addresses',
    description: 'IP addresses separated by spaces that get no answer.'},

  {key: 'AI_MOVE_DELAY_MS', group: 'AI opponents', kind: 'number', label: 'Pause before follow-up questions (ms)',
    description: 'Where to place a tile, how to pay … Empty: 600.'},
  {key: 'AI_ACTION_DELAY_MS', group: 'AI opponents', kind: 'number', label: 'Pause before a new action (ms)',
    description: 'So players can follow what the AI just did. Empty: 2000.'},
  {key: 'AI_DECISION_LOG_DIR', group: 'AI opponents', kind: 'text', label: 'Folder for decision logs',
    description: 'The AI writes every decision there (for training). Empty: no logs.'},

  {key: 'SERVER_ID', group: 'Access', kind: 'secret', label: 'Admin passphrase (serverId)',
    description: 'Opens the admin pages. Changing it changes the address of this page. Empty: a new random one at every start.'},
  {key: 'STATS_ID', group: 'Access', kind: 'secret', label: 'Statistics passphrase',
    description: 'Opens the statistics endpoint without the admin passphrase. Empty: random.'},
  {key: 'DISCORD_CLIENT_ID', group: 'Access', kind: 'text', label: 'Discord client ID',
    description: 'Login with Discord (experimental).'},
  {key: 'DISCORD_CLIENT_SECRET', group: 'Access', kind: 'secret', label: 'Discord client secret',
    description: 'Login with Discord (experimental).'},
  {key: 'DISCORD_ADMIN_USER_IDS', group: 'Access', kind: 'text', label: 'Discord admins',
    description: 'Discord IDs separated by semicolons that may use the admin pages without the passphrase.'},
  {key: 'SESSION_DURATION', group: 'Access', kind: 'text', label: 'Login duration',
    description: 'How long a login stays valid, e.g. 30m or 12h. Empty: 30m.'},
  {key: 'URL_ROOT', group: 'Access', kind: 'text', label: 'Public address',
    description: 'Root address of this server, used for login redirects.'},

  {key: 'PORT', group: 'Technical', kind: 'number', label: 'Port',
    description: 'Port the server listens on. In Docker it must stay 8080.'},
  {key: 'HOST', group: 'Technical', kind: 'text', label: 'Host',
    description: 'Network interface to listen on. Empty: all.'},
  {key: 'CERT_PATH', group: 'Technical', kind: 'text', label: 'TLS certificate',
    description: 'Path of the certificate (fullchain.pem). Empty: plain HTTP.'},
  {key: 'KEY_PATH', group: 'Technical', kind: 'text', label: 'TLS key',
    description: 'Path of the private key (privkey.pem).'},
  {key: 'LOCAL_FS_DB', group: 'Technical', kind: 'text', label: 'Store games as files',
    description: 'When set, games are saved as JSON files instead of the database. Switching loses access to the games of the other storage.'},
  {key: 'POSTGRES_HOST', group: 'Technical', kind: 'secret', label: 'PostgreSQL connection',
    description: 'Connection string of a PostgreSQL database. Empty: SQLite file. Switching loses access to the games of the other storage.'},
  {key: 'POSTGRES_TRIM_COUNT', group: 'Technical', kind: 'number', label: 'PostgreSQL rows to trim',
    description: 'Only with PostgreSQL. Empty: 10.'},
  {key: 'DB_COMPRESS_ON_WRITE', group: 'Technical', kind: 'toggle', label: 'Compress when saving',
    description: 'Only with PostgreSQL.'},
  {key: 'ASSET_CACHE_MAX_AGE', group: 'Technical', kind: 'number', label: 'Browser cache for images and fonts (s)',
    description: 'Empty: 0.'},
  {key: 'THROW_STATE_ERRORS', group: 'Technical', kind: 'toggle', label: 'Stop on state errors',
    description: 'For development: inconsistent game states raise an error instead of a log line.'},
];

export function serverSettingDefinition(key: string): ServerSettingDefinition | undefined {
  return SERVER_SETTINGS.find((setting) => setting.key === key);
}

/** One row of the admin page: the value in effect and where it comes from. */
export type ServerSettingState = {
  key: string,
  /** From the .env file (or the container), before the admin page changed anything */
  base: string | undefined,
  /** Set on the admin page; undefined: the base value applies */
  saved: string | undefined,
  /** Value of the running server process (changes take effect after a restart) */
  running: string | undefined,
};

export type ServerSettingsModel = {
  settings: ReadonlyArray<ServerSettingState>,
};

/** POST: key → new value; null removes the value set on the admin page (the .env value applies again). */
export type ServerSettingsUpdate = Record<string, string | null>;
