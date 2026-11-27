// Server settings that can be changed on the admin page instead of editing the .env file by hand (it writes the file).
// One list for both sides: the server only accepts these keys (serverSettingsFile.ts), the page shows them
// in this order and grouping (ServerSettingsPanel.vue).

import {COMMON_EXTENSIONS} from '../../genfiles/extensionsCommon';
import {AI_LEVELS} from '../ai/AiLevel';
import {DEFAULT_RUST_BOT_STRENGTH, RUST_BOT_STRENGTH_LIMITS, RUST_BOT_STRENGTH_SLIDERS, RustBotStrengthField, rustBotStrengthKey} from '../ai/rustBotStrength';
import {TRAINING_SHARE_DEFAULT_URL} from '../trainingShare/TrainingShareModel';
import {DEFAULT_FAVICON_COLOR, DEFAULT_FAVICON_ICON, FAVICON_COLORS, FAVICON_ICONS, FaviconOption, faviconImage} from './favicons';

// image: an address (http… or an uploaded file, see ApiAdminServerLogo) with upload button and preview
// choice: one of fixed values, a drop-down with a picture per value (choices, choiceImage)
export type ServerSettingKind = 'text' | 'number' | 'secret' | 'toggle' | 'image' | 'choice' | 'segmented';

export type ServerSettingChoice = {
  /** Value in the .env file; '' = the default (the line is removed) */
  value: string,
  /** Name of the choice (translated), e.g. a color */
  label: string,
};

// Appearance, Games, Limits, AI opponents, Access, Technical – and the groups of the extensions
export type ServerSettingGroup = string;

export type ServerSettingDefinition = {
  key: string,
  group: ServerSettingGroup,
  kind: ServerSettingKind,
  label: string,
  description: string,
  /** kind 'number': the smallest allowed value (default 0) */
  minimum?: number,
  /** kind 'number': the largest allowed value (default none) */
  maximum?: number,
  /** The value that applies without a line in the .env; the field shows it as its value (never a grey placeholder) */
  placeholder?: string,
  /** kind 'number': a slider next to the field over this range (the field itself accepts minimum to maximum) */
  slider?: {minimum: number, maximum: number, step: number},
  /**
   * Part of a table instead of a row of its own: settings with the same row share one line, one field per column
   * (AI strength: a field for easy, normal and hard)
   */
  grid?: {row: string, column: string},
  /**
   * Heading of a block of related settings within the tab (e.g. all waiting times together); settings of one
   * section follow each other in this list. Translated.
   */
  section?: string,
  /** In the second column on wide screens (AI tab: the strength table next to the general settings) */
  side?: boolean,
  /** kind 'choice' or 'segmented': the allowed values */
  choices?: ReadonlyArray<ServerSettingChoice>,
  /**
   * kind 'choice': picture of a value; gets the values of all fields, so a choice can show itself
   * together with another one (the icon in the chosen color and the other way round)
   */
  choiceImage?: (value: string, values: Readonly<Record<string, string>>) => string,
  /** kind 'toggle': on while the .env has no line for it; the line then holds 'false' when switched off */
  defaultOn?: boolean,
  /** Takes effect when saved, without a restart (the server reads it at every use) */
  live?: boolean,
};

// Favicon choices: the default is stored as '' (no line in the .env)
function faviconChoices(options: ReadonlyArray<FaviconOption>, defaultId: string): Array<ServerSettingChoice> {
  return options.map(({id, label}) => ({value: id === defaultId ? '' : id, label}));
}

const BASE_SETTING_GROUPS: ReadonlyArray<ServerSettingGroup> = ['Appearance', 'Games', 'Limits', 'AI opponents', 'Access', 'Export', 'Technical'];

// One line per value of the Rust bot, one field per strength (common/ai/rustBotStrength.ts)
const AI_STRENGTH_ROWS: Record<RustBotStrengthField, {label: string, description: string}> = {
  rollouts: {label: 'Rollouts', description: 'Games played ahead per candidate move. The main lever of strength.'},
  threads: {label: 'Threads', description: 'Processor cores per decision. More is faster, not stronger.'},
  horizon: {label: 'Lookahead (moves)', description: 'How far each rollout looks ahead. 0: to the end of the game.'},
  candidates: {label: 'Candidates', description: 'Moves the AI considers at all. Fewer: it overlooks good moves.'},
  timeLimit: {label: 'Thinking time (ms)',
    description: 'Per move while humans play along: the AI takes this long, the Rust AI searches for this long. Without humans it plays at full speed.'},
  randomness: {label: 'Randomness (%)', description: '0: always the best move. Higher: more often a slightly worse one, never nonsense. Needs a bot that supports it.'},
};

// The strength table: one row per value, one field per strength
function aiStrengthSettings(fields: ReadonlyArray<RustBotStrengthField>, section: string, side: boolean): Array<ServerSettingDefinition> {
  return fields.flatMap((field) => AI_LEVELS.map((level): ServerSettingDefinition => ({
    key: rustBotStrengthKey(level, field),
    // In the AI tab next to the other AI settings, as a table (ServerSettingGrid.vue)
    group: 'AI opponents',
    section,
    side,
    kind: 'number',
    live: true,
    label: AI_STRENGTH_ROWS[field].label,
    description: AI_STRENGTH_ROWS[field].description,
    minimum: RUST_BOT_STRENGTH_LIMITS[field].minimum,
    maximum: RUST_BOT_STRENGTH_LIMITS[field].maximum,
    placeholder: String(DEFAULT_RUST_BOT_STRENGTH[level][field]),
    slider: RUST_BOT_STRENGTH_SLIDERS[field],
    grid: {row: field, column: level},
  })));
}

const BASE_SETTINGS: ReadonlyArray<ServerSettingDefinition> = [
  {key: 'SERVER_NAME', group: 'Appearance', kind: 'text', label: 'Server name',
    description: 'Shown in white under the title on the start page. Empty: nothing is shown.'},
  {key: 'SERVER_LOGO_NAME', group: 'Appearance', kind: 'text', label: 'Logo name',
    description: 'Shown large next to the logo on the admin dashboard. Empty: the server name, otherwise the host name.'},
  {key: 'SERVER_LOGO_IMAGE', group: 'Appearance', kind: 'image', label: 'Logo image',
    description: 'Upload an image or enter its web address (PNG, JPEG, WebP; ideally with a transparent background). Empty: no image.'},
  {key: 'TITLE_LONG', group: 'Appearance', kind: 'text', label: 'Long tab title', placeholder: 'Terraforming Mars',
    description: 'Browser tab of the start page.'},
  {key: 'TITLE_SHORT', group: 'Appearance', kind: 'text', label: 'Short tab title', placeholder: 'TM',
    description: 'End of all other tab titles, e.g. "Cards List | TM".'},
  {key: 'FAVICON_ICON', group: 'Appearance', kind: 'choice', label: 'Tab icon',
    description: 'Picture in the browser tab. Empty: Mars.',
    choices: faviconChoices(FAVICON_ICONS, DEFAULT_FAVICON_ICON),
    choiceImage: (value, values) => faviconImage(value || undefined, values.FAVICON_COLOR || undefined)},
  {key: 'FAVICON_COLOR', group: 'Appearance', kind: 'choice', label: 'Tab icon color',
    description: 'A color per server tells several servers apart at a glance. Empty: orange.',
    choices: faviconChoices(FAVICON_COLORS, DEFAULT_FAVICON_COLOR),
    choiceImage: (value, values) => faviconImage(values.FAVICON_ICON || undefined, value || undefined)},

  {key: 'MAX_GAME_DAYS', group: 'Games', kind: 'number', minimum: 1, label: 'Delete unfinished games after (days)',
    description: 'Unfinished games created more than this many days ago are deleted (checked every hour). Finished games are never deleted. Empty: never (with PostgreSQL: 10 days).'},
  {key: 'COMPRESS_COMPLETED_GAMES_DAYS', group: 'Games', kind: 'number', minimum: 1, label: 'Shrink finished games after (days)',
    description: 'Finished games keep only their final state after this many days (about 18 MB → 0.1 MB); the states of the single moves are lost. Empty: never.'},
  {key: 'WAITING_FOR_TIMEOUT', group: 'Games', kind: 'number', label: 'Waiting check interval (ms)', placeholder: '1000',
    slider: {minimum: 500, maximum: 10000, step: 250},
    description: 'How often a waiting player asks whether it is their turn again.'},
  {key: 'GAME_CACHE', group: 'Games', kind: 'text', label: 'Game memory',
    description: 'When games are removed from memory, e.g. sweep=auto;eviction_age=15m;idle_age=1h;sweep_freq=5m. Empty: never.'},

  {key: 'GAME_QUOTA', group: 'Limits', kind: 'text', label: 'New games per address',
    description: 'How many games one address may create, e.g. {"limit":3,"per":"10m"} or a list of such limits. Empty: unlimited.'},
  {key: 'MIN_RESPONSE_INTERVAL_MS', group: 'Limits', kind: 'number', label: 'Minimum time between inputs (ms)', placeholder: '0',
    slider: {minimum: 0, maximum: 2000, step: 50},
    description: 'Faster inputs of a player are refused (against bots). 0: no limit.'},
  {key: 'IP_BLOCKLIST', group: 'Limits', kind: 'text', label: 'Blocked addresses',
    description: 'IP addresses separated by spaces that get no answer.'},

  {key: 'AI_RUST_EXTRA_WAIT_MS', group: 'AI opponents', section: 'AI program', kind: 'number', live: true, label: 'Standard move after (ms)',
    placeholder: '10000', slider: {minimum: 3000, maximum: 25000, step: 500},
    description: 'Extra time on top of the thinking time. Without an answer of the Rust AI by then, a standard move decides.'},
  // Per strength: the thinking time first (it also paces the TypeScript AI), then how much the Rust AI searches,
  // the hardware (threads) last
  ...aiStrengthSettings(['timeLimit', 'rollouts', 'candidates', 'horizon', 'randomness', 'threads'], 'Strength of the Rust AI', true),
  {key: 'AI_DECISION_LOG_DIR', group: 'AI opponents', section: 'Training data', kind: 'text', label: 'Folder for decision logs',
    description: 'The AI writes every decision there (for training). Empty: no logs.'},
  {key: 'AI_TRAINING_FEED', group: 'AI opponents', section: 'Training data', kind: 'text', label: 'AI test runs in the lobby',
    description: 'Address of the AI test run feed with the name of this computer, e.g. http://…/api/lobby-feed?instance=ak1. The lobby shows its running games and the last finished ones. Empty: none.'},

  {key: 'SERVER_ID', group: 'Access', kind: 'secret', label: 'Admin passphrase (serverId)',
    description: 'Log in to the admin pages with it. Changing it ends every admin login. Empty: a new random one at every start.'},
  {key: 'DISCORD_CLIENT_ID', group: 'Access', kind: 'text', label: 'Discord client ID',
    description: 'Login with Discord (experimental).'},
  {key: 'DISCORD_CLIENT_SECRET', group: 'Access', kind: 'secret', label: 'Discord client secret',
    description: 'Login with Discord (experimental).'},
  {key: 'DISCORD_ADMIN_USER_IDS', group: 'Access', kind: 'text', label: 'Discord admins',
    description: 'Discord IDs separated by semicolons that may use the admin pages without the passphrase.'},
  {key: 'SESSION_DURATION', group: 'Access', kind: 'text', label: 'Login duration', placeholder: '30d',
    description: 'How long a login (admin and Discord) stays valid, e.g. 30d or 12h.'},
  {key: 'URL_ROOT', group: 'Access', kind: 'text', label: 'Public address',
    description: 'Root address of this server, used for login redirects.'},

  {key: 'TRAINING_SHARE', group: 'Export', kind: 'segmented', label: 'Share games for the AI training',
    // The default (no line in the .env) is 'auto', so it is the empty value here
    choices: [{value: 'off', label: 'Off'}, {value: 'manual', label: 'Button per game'}, {value: '', label: 'Every finished game'}],
    description: 'Finished games with at least one human go to the AI training of this fork: every move, the decisions and the ratings of AI moves. Button per game: "Share" in the list of finished games. Default: every finished game. Takes effect after a restart.'},
  {key: 'TRAINING_SHARE_ANONYMOUS', group: 'Export', kind: 'toggle', defaultOn: true, live: true, label: 'Anonymous',
    description: 'Player names become "Player 1", "Player 2" …, the game name and the texts of ratings are left out. Game and player ids are always replaced, IP addresses and the address of this server are never part of it.'},
  {key: 'TRAINING_SHARE_URL', group: 'Export', kind: 'text', label: 'Receiver', placeholder: TRAINING_SHARE_DEFAULT_URL,
    description: 'Address the games are sent to. Empty: the receiver of this fork.'},

  {key: 'PORT', group: 'Technical', kind: 'number', label: 'Port', placeholder: '8080',
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
  {key: 'POSTGRES_TRIM_COUNT', group: 'Technical', kind: 'number', label: 'PostgreSQL rows to trim', placeholder: '10',
    description: 'Only with PostgreSQL.'},
  {key: 'DB_COMPRESS_ON_WRITE', group: 'Technical', kind: 'toggle', label: 'Compress when saving',
    description: 'Only with PostgreSQL.'},
  {key: 'ASSET_CACHE_MAX_AGE', group: 'Technical', kind: 'number', label: 'Browser cache for images and fonts (s)', placeholder: '0',
    description: 'How long browsers keep images and fonts without asking the server again. 0: they always ask.'},
  {key: 'THROW_STATE_ERRORS', group: 'Technical', kind: 'toggle', label: 'Stop on state errors',
    description: 'For development: inconsistent game states raise an error instead of a log line.'},
];

// Optional extensions (src/extensions/) add their own rows; a new group gets its own section before "Technical"
const EXTENSION_SETTINGS = COMMON_EXTENSIONS.flatMap((extension) => extension.serverSettings ?? []);
const EXTENSION_GROUPS = [...new Set(EXTENSION_SETTINGS.map((setting) => setting.group))].filter((group) => !BASE_SETTING_GROUPS.includes(group));

export const SERVER_SETTING_GROUPS: ReadonlyArray<ServerSettingGroup> = [...BASE_SETTING_GROUPS.slice(0, -1), ...EXTENSION_GROUPS, 'Technical'];
export const SERVER_SETTINGS: ReadonlyArray<ServerSettingDefinition> = [...BASE_SETTINGS, ...EXTENSION_SETTINGS];

export function serverSettingDefinition(key: string): ServerSettingDefinition | undefined {
  return SERVER_SETTINGS.find((setting) => setting.key === key);
}

/** One row of the admin page: the value in the .env file and the one the server runs with. */
export type ServerSettingState = {
  key: string,
  /** In the .env file; undefined: not set (the default applies) */
  value: string | undefined,
  /** Value of the running server process (changes take effect after a restart) */
  running: string | undefined,
};

export type ServerSettingsModel = {
  settings: ReadonlyArray<ServerSettingState>,
};

/** POST: key → new value; null or an empty value removes the line from the .env file (the default applies). */
export type ServerSettingsUpdate = Record<string, string | null>;
