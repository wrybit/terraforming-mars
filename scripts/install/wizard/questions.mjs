// All questions of the wizard. Each can also be answered by an option (--port=8080 etc.),
// so everything the menu and the unattended mode share lives here.
import crypto from 'node:crypto';
import path from 'node:path';
import {DEFAULT_PORT} from './constants.mjs';
import {POSTGRES_DEFAULTS, parseConnection} from './postgresConnection.mjs';
import {servicesFor} from './services/index.mjs';
import {readVariable} from './steps/environment.mjs';
import {homeRelative} from './ui/text.mjs';

/** Value from an existing .env, so an update offers the current settings as defaults. */
function existing(answers, key) {
  return answers.installDirectory ? readVariable(answers.installDirectory, key) : undefined;
}

/** One part of the PostgreSQL connection stored in .env, if there is one. */
function existingPostgres(answers, part) {
  const connection = existing(answers, 'POSTGRES_HOST');
  return connection ? parseConnection(connection)[part] : undefined;
}

function required(label) {
  return (text) => (text ? undefined : `Enter the ${label}`);
}

/** Rust AI package that fits the chosen run mode: Docker always needs the Linux one. */
export function rustAiPackageFor(answers, platform) {
  return answers.runMode === 'docker' ? platform.rustAiPackages.docker : platform.rustAiPackages.native;
}

function validatePort(text) {
  const port = Number(text);
  return Number.isInteger(port) && port >= 1 && port <= 65535 ? undefined : 'Enter a number between 1 and 65535';
}

function validateUrl(text) {
  if (text === '') {
    return undefined;
  }
  return /^https?:\/\/[^\s/]+/.test(text) ? undefined : 'Start with http:// or https://';
}

export const QUESTIONS = [
  {
    id: 'installDirectory',
    kind: 'input',
    message: 'Install folder',
    initial: (answers, context) => homeRelative(context.defaultDirectory),
    validate: (text) => (text ? undefined : 'Enter a folder'),
    normalize: (text) => path.resolve(text.replace(/^~(?=$|[\\/])/, process.env.HOME ?? process.env.USERPROFILE ?? '~')),
  },
  {
    id: 'serverName',
    kind: 'input',
    message: 'Server name',
    hint: 'shown on the start page, optional',
    initial: (answers) => existing(answers, 'SERVER_NAME') ?? '',
  },
  {
    id: 'port',
    kind: 'input',
    message: 'Port',
    initial: (answers) => existing(answers, 'PORT') ?? String(DEFAULT_PORT),
    validate: validatePort,
  },
  {
    id: 'adminPassphrase',
    kind: 'secret',
    message: 'Admin password',
    hint: 'for /admin – Enter keeps a random one',
    initial: (answers) => existing(answers, 'SERVER_ID') ?? crypto.randomBytes(12).toString('base64url'),
    validate: (text) => (text.length >= 8 ? undefined : 'At least 8 characters'),
  },
  {
    id: 'database',
    kind: 'select',
    message: 'Database',
    initial: (answers) => (existing(answers, 'POSTGRES_HOST') ? 'postgres' : 'sqlite'),
    choices: () => [
      {label: 'SQLite', value: 'sqlite', hint: 'built in – recommended'},
      {label: 'PostgreSQL', value: 'postgres', hint: 'own database server'},
    ],
  },
  {
    id: 'postgresHost',
    kind: 'input',
    message: 'Database server',
    hint: 'host name or IP address',
    when: (answers) => answers.database === 'postgres',
    initial: (answers) => existingPostgres(answers, 'host') ?? POSTGRES_DEFAULTS.host,
    validate: required('server'),
  },
  {
    id: 'postgresPort',
    kind: 'input',
    message: 'Database port',
    when: (answers) => answers.database === 'postgres',
    initial: (answers) => existingPostgres(answers, 'port') ?? POSTGRES_DEFAULTS.port,
    validate: validatePort,
  },
  {
    id: 'postgresDatabase',
    kind: 'input',
    message: 'Database name',
    when: (answers) => answers.database === 'postgres',
    initial: (answers) => existingPostgres(answers, 'database') ?? POSTGRES_DEFAULTS.database,
    validate: required('database name'),
  },
  {
    id: 'postgresUser',
    kind: 'input',
    message: 'Database user',
    when: (answers) => answers.database === 'postgres',
    initial: (answers) => existingPostgres(answers, 'user') ?? POSTGRES_DEFAULTS.user,
    validate: required('user'),
  },
  {
    id: 'postgresPassword',
    kind: 'secret',
    message: 'Database password',
    hint: 'empty if the server needs none',
    when: (answers) => answers.database === 'postgres',
    initial: (answers) => existingPostgres(answers, 'password') ?? '',
  },
  {
    id: 'publicUrl',
    kind: 'input',
    message: 'Public address',
    hint: 'e.g. https://tm.example.org – empty if only local',
    initial: (answers) => existing(answers, 'URL_ROOT') ?? '',
    validate: validateUrl,
  },
  {
    id: 'runMode',
    kind: 'select',
    message: 'How should the server run?',
    initial: (answers, context) => servicesFor(context.platform).find((service) => !service.unavailableReason(context.platform))?.id,
    choices: (answers, context) => servicesFor(context.platform).map((service) => ({
      label: service.label,
      value: service.id,
      hint: service.hint,
      disabled: service.unavailableReason(context.platform),
    })),
  },
  {
    id: 'aiEngine',
    kind: 'select',
    message: 'AI opponent',
    initial: (answers) => existing(answers, 'AI_ENGINE') ?? 'typescript',
    choices: (answers, {platform}) => {
      const rustPackage = rustAiPackageFor(answers, platform);
      const rustUnavailable = rustPackage ? undefined : 'not released yet';
      return [
        {label: 'Built-in AI', value: 'typescript', hint: 'works right away'},
        {label: 'Rust AI', value: 'rust', hint: 'stronger engine', disabled: rustUnavailable},
      ];
    },
  },
];
