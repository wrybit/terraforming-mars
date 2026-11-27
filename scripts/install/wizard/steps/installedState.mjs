// What an existing installation runs and what is new: game code (git) and Rust AI (release), plus how it runs.
// The update screen is built from this; the demo fakes the same shape.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {capture} from '../commands.mjs';
import {DEFAULT_BRANCH, DEFAULT_PORT, SERVICE_NAME} from '../constants.mjs';
import {rustAiPackageFor} from '../questions.mjs';
import {readVariable} from './environment.mjs';
import {readInstallRecord} from './installRecord.mjs';

const NEW_COMMITS_SHOWN = 5;

function git(directory, args) {
  return capture('git', ['-C', directory, ...args]);
}

/** Version of a package name or tag: "rust-ai-1.12" → "1.12" */
export function rustAiVersionOf(tag) {
  return tag?.replace(/^rust-ai-v?/, '');
}

/** Negative: a is older than b */
export function compareVersions(a, b) {
  const left = a.split('.').map((part) => parseInt(part, 10) || 0);
  const right = b.split('.').map((part) => parseInt(part, 10) || 0);
  for (let index = 0; index < Math.max(left.length, right.length); index++) {
    const difference = (left[index] ?? 0) - (right[index] ?? 0);
    if (difference !== 0) {
      return difference;
    }
  }
  return 0;
}

/** Installed Rust AI: version from its support file; undefined if there is none. */
function installedRustAi(directory) {
  const folder = path.join(directory, 'db', 'rust-ai');
  if (!fs.existsSync(path.join(folder, 'bot')) && !fs.existsSync(path.join(folder, 'bot.exe'))) {
    return undefined;
  }
  try {
    return JSON.parse(fs.readFileSync(path.join(folder, 'rust-ai-support.json'), 'utf8')).aiVersion ?? '?';
  } catch {
    return '?';
  }
}

/**
 * Run mode of the installation: from the installer's record, otherwise from what is there
 * (installations of older installers have no record).
 */
function detectRunMode(directory) {
  const recorded = readInstallRecord(directory)?.runMode;
  if (recorded !== undefined) {
    return recorded;
  }
  if (fs.existsSync(path.join(directory, 'docker-compose.override.yml'))) {
    return 'docker';
  }
  if (fs.existsSync(`/etc/systemd/system/${SERVICE_NAME}.service`)) {
    return 'systemd';
  }
  if (fs.existsSync(path.join(os.homedir(), 'Library', 'LaunchAgents', 'org.terraforming-mars.server.plist'))) {
    return 'launchd';
  }
  if (fs.existsSync(path.join(directory, 'db', 'start-server.ps1'))) {
    return 'windows-task';
  }
  return 'none';
}

export function readInstalledState(directory, platform) {
  // Fetch quietly; without network the screen still shows the installed state
  const fetched = git(directory, ['fetch', '--quiet', 'origin', DEFAULT_BRANCH]) !== undefined;
  const remote = `origin/${DEFAULT_BRANCH}`;
  const runMode = detectRunMode(directory);
  const rustInstalled = installedRustAi(directory);
  const rustPackage = rustAiPackageFor({runMode}, platform);
  const rustAvailable = rustAiVersionOf(rustPackage?.tag);
  const behind = fetched ? Number(git(directory, ['rev-list', '--count', `HEAD..${remote}`]) ?? 0) : undefined;
  return {
    directory,
    port: Number(readVariable(directory, 'PORT') ?? DEFAULT_PORT),
    runMode,
    game: {
      commit: git(directory, ['rev-parse', '--short', 'HEAD']),
      date: git(directory, ['log', '-1', '--format=%cs']),
      // Commit time of the installed version and of the last installer run (update or settings), in ms
      dateMs: Number(git(directory, ['log', '-1', '--format=%ct']) ?? 0) * 1000 || undefined,
      lastUpdateMs: Date.parse(readInstallRecord(directory)?.updatedAt ?? '') || undefined,
      latestCommit: fetched ? git(directory, ['rev-parse', '--short', remote]) : undefined,
      latestDate: fetched ? git(directory, ['log', '-1', '--format=%cs', remote]) : undefined,
      behind,
      newTitles: behind ? (git(directory, ['log', `--max-count=${NEW_COMMITS_SHOWN}`, '--format=%s', `HEAD..${remote}`]) ?? '').split('\n').filter(Boolean) : [],
      offline: !fetched,
    },
    rustAi: {
      installed: rustInstalled,
      available: rustAvailable,
      package: rustPackage,
      // Only a Rust AI that is there gets updated; adding one is a settings change
      hasUpdate: rustInstalled !== undefined && rustAvailable !== undefined && (rustInstalled === '?' || compareVersions(rustInstalled, rustAvailable) < 0),
    },
  };
}

export function hasUpdate(state) {
  return (state.game.behind ?? 0) > 0 || state.rustAi.hasUpdate;
}
