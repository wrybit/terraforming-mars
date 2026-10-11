import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import {SERVER_SETTINGS, ServerSettingsModel, ServerSettingsUpdate, serverSettingDefinition} from '../../common/admin/serverSettings';

// Settings changed on the admin page live in their own file in the database folder (it survives updates and
// is writable inside the container), next to the .env file the server is started with. At start they are laid
// over the .env values; the admin page shows both, so a value can be reset to what the .env says.

function settingsFile(): string {
  return process.env.SERVER_SETTINGS_FILE ?? path.resolve('db', 'server-settings.env');
}

// Values before the admin settings were applied (.env file or container environment), and the values this
// process actually runs with – a saved change only takes effect after a restart
const baseValues = new Map<string, string | undefined>();
const runningValues = new Map<string, string | undefined>();

function readSaved(): Record<string, string> {
  try {
    return dotenv.parse(fs.readFileSync(settingsFile(), 'utf8'));
  } catch {
    // No file yet: nothing changed on the admin page
    return {};
  }
}

/** Called once at start (init.ts), before any module reads its settings. */
export function applySavedServerSettings(): void {
  const saved = readSaved();
  for (const {key} of SERVER_SETTINGS) {
    baseValues.set(key, process.env[key]);
    if (saved[key] !== undefined) {
      process.env[key] = saved[key];
    }
    runningValues.set(key, process.env[key]);
  }
}

export function readServerSettings(): ServerSettingsModel {
  const saved = readSaved();
  return {
    settings: SERVER_SETTINGS.map(({key}) => ({
      key,
      base: baseValues.get(key),
      saved: saved[key],
      running: runningValues.get(key),
    })),
  };
}

// Literal values for dotenv: single quotes take everything as is; values containing one use backticks
function serialize(key: string, value: string): string {
  const singleLine = value.replace(/\r?\n/g, ' ');
  return singleLine.includes('\'') ? `${key}=\`${singleLine.replace(/`/g, '')}\`` : `${key}='${singleLine}'`;
}

/** Merges the update into the saved settings; unknown keys are refused. Returns the new state. */
export function writeServerSettings(update: ServerSettingsUpdate): ServerSettingsModel {
  const saved = readSaved();
  for (const [key, value] of Object.entries(update)) {
    if (serverSettingDefinition(key) === undefined) {
      throw new Error('unknown setting ' + key);
    }
    if (value === null) {
      delete saved[key];
    } else {
      saved[key] = value;
    }
  }
  const lines = [
    '# Written by the admin page (Server settings). Overrides the .env file; takes effect after a restart.',
    ...SERVER_SETTINGS.filter(({key}) => saved[key] !== undefined).map(({key}) => serialize(key, saved[key])),
  ];
  fs.mkdirSync(path.dirname(settingsFile()), {recursive: true});
  fs.writeFileSync(settingsFile(), lines.join('\n') + '\n');
  return readServerSettings();
}
