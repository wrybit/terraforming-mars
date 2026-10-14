import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import {SERVER_SETTINGS, ServerSettingsModel, ServerSettingsUpdate, serverSettingDefinition} from '../../common/admin/serverSettings';
import {isValidSettingValue} from '../../common/admin/isValidSettingValue';

// The admin page reads and writes the server's .env file itself – one place for all settings. In Docker the
// file is mounted into the container (SERVER_SETTINGS_FILE, see the update scripts); locally it is the .env in
// the working directory. The server reads it at every start, so a restart applies the changes.

function settingsFile(): string {
  return process.env.SERVER_SETTINGS_FILE ?? path.resolve('.env');
}

// Earlier the admin page saved into its own file in the database folder; its values move into the .env once
const legacySettingsFile = path.resolve('db', 'server-settings.env');

// Values this process runs with: a saved change only takes effect after a restart
const runningValues = new Map<string, string | undefined>();

function readContent(): string {
  try {
    return fs.readFileSync(settingsFile(), 'utf8');
  } catch {
    // No file yet: nothing set
    return '';
  }
}

// Literal values for dotenv: single quotes take everything as is; values containing one use backticks
function serialize(key: string, value: string): string {
  // Every line break (also a lone \r) becomes a space: a value must never start a new line in the .env file
  const singleLine = value.replace(/[\r\n]+/g, ' ');
  return singleLine.includes('\'') ? `${key}=\`${singleLine.replace(/`/g, '')}\`` : `${key}='${singleLine}'`;
}

function isLineOf(line: string, key: string): boolean {
  return new RegExp(`^\\s*(export\\s+)?${key}\\s*=`).test(line);
}

// Changes only the lines of the given keys; comments and all other lines stay as they are
function writeValues(update: ServerSettingsUpdate): void {
  let lines = readContent().split('\n');
  if (lines[lines.length - 1] === '') {
    lines.pop();
  }
  for (const [key, value] of Object.entries(update)) {
    // A key set twice keeps only its first line
    const first = lines.findIndex((line) => isLineOf(line, key));
    lines = lines.filter((line, index) => index <= first || !isLineOf(line, key));
    if (value === null || value === '') {
      // Empty means not set: the server uses its default
      if (first >= 0) {
        lines.splice(first, 1);
      }
    } else if (first >= 0) {
      lines[first] = serialize(key, value);
    } else {
      lines.push(serialize(key, value));
    }
  }
  // In place (no new file): in Docker the file is mounted, a replaced file would not reach the host
  fs.writeFileSync(settingsFile(), lines.join('\n') + '\n');
}

function migrateLegacySettings(): void {
  if (!fs.existsSync(legacySettingsFile) || path.resolve(settingsFile()) === legacySettingsFile) {
    return;
  }
  try {
    const legacy = dotenv.parse(fs.readFileSync(legacySettingsFile, 'utf8'));
    writeValues(Object.fromEntries(Object.entries(legacy).filter(([key]) => serverSettingDefinition(key) !== undefined)));
    fs.rmSync(legacySettingsFile);
    console.log('Moved the admin settings from db/server-settings.env into ' + settingsFile());
  } catch (error) {
    console.error('Could not move db/server-settings.env into the settings file', error);
  }
}

/**
 * Called once at start (init.ts), before any module reads its settings.
 * The file overrides what dotenv loaded, but not the variables the process was started with
 * (e.g. PORT=8095 for a second local server): those were set on purpose for this one start.
 */
export function applyServerSettings(launchEnvironmentKeys: ReadonlySet<string> = new Set()): void {
  migrateLegacySettings();
  for (const [key, value] of Object.entries(dotenv.parse(readContent()))) {
    if (!launchEnvironmentKeys.has(key)) {
      process.env[key] = value;
    }
  }
  for (const {key} of SERVER_SETTINGS) {
    runningValues.set(key, process.env[key]);
  }
}

export function readServerSettings(): ServerSettingsModel {
  const values = dotenv.parse(readContent());
  return {
    settings: SERVER_SETTINGS.map(({key}) => ({key, value: values[key], running: runningValues.get(key)})),
  };
}

/** Writes the update into the settings file; unknown keys are refused. Returns the new state. */
export function writeServerSettings(update: ServerSettingsUpdate): ServerSettingsModel {
  for (const [key, value] of Object.entries(update)) {
    const definition = serverSettingDefinition(key);
    if (definition === undefined) {
      throw new Error('unknown setting ' + key);
    }
    if (!isValidSettingValue(definition, value)) {
      throw new Error(`${key} needs a whole number of at least ${definition.minimum ?? 0}`);
    }
  }
  writeValues(update);
  return readServerSettings();
}
