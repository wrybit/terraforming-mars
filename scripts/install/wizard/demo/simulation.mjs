// Fake install steps for the demo: same checklist as a real run, with waiting instead of work.
import fs from 'node:fs';
import {confirm} from '../prompts.mjs';
import {style} from '../ui/theme.mjs';
import {writeLine} from '../terminal.mjs';
import {LIST_INDENT} from '../ui/layout.mjs';

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/** Counts a progress bar up over `milliseconds`; stops early at `failAt` (0..1) with an error. */
async function progressFor(handle, milliseconds, failAt, message) {
  const ticks = 30;
  for (let tick = 1; tick <= ticks; tick++) {
    await wait(milliseconds / ticks);
    handle.progress(tick / ticks);
    if (failAt !== undefined && tick / ticks >= failAt) {
      throw new Error(message);
    }
  }
}

function fakeLog(logFile, lines) {
  fs.appendFileSync(logFile, `${lines.join('\n')}\n`);
}

/** What install.sh / install.ps1 do before the wizard when Git or Node are missing. */
export async function simulateRequirements(missing) {
  if (missing === 'none') {
    return;
  }
  const tools = missing === 'both' ? ['Git', 'Node.js 22'] : ['Node.js 22'];
  for (const tool of tools) {
    const install = await confirm({message: `${tool} is missing. Install it now?`, yes: 'Install', no: 'Cancel'});
    if (!install) {
      writeLine(`\n${LIST_INDENT}${style.red('✖')} ${tool} is required. ${style.gray('(demo ends here)')}\n`);
      process.exit(1);
    }
    writeLine(`${LIST_INDENT}${style.gray(`  installing ${tool}${tool === 'Git' ? '' : ' with fnm'} …`)}`);
    await wait(900);
  }
  writeLine();
}

export function simulatedSteps({answers, service, failure, logFile}) {
  const steps = [
    {title: answers.isUpdate ? 'Update code' : 'Download code', run: () => wait(1200)},
    {title: 'Write settings', run: () => wait(400)},
  ];
  if (service.needsLocalBuild !== false) {
    steps.push({title: 'Install dependencies', run: (handle) => progressFor(handle, 2500)});
    steps.push({title: 'Build game', run: (handle) => {
      if (failure === 'build') {
        fakeLog(logFile, ['> terraforming-mars@1.0.0 build:server', '> tsc --build src/tsconfig.json', 'src/server/Game.ts(12,7): error TS2322: Type \'string\' is not assignable to type \'number\'.', 'npm ERR! code 2']);
      }
      return progressFor(handle, 3500, failure === 'build' ? 0.6 : undefined, '"npm run build" failed with exit code 2 (demo)');
    }});
  }
  if (answers.aiEngine === 'rust') {
    steps.push({title: 'Install Rust AI', run: (handle) => progressFor(handle, 1500)});
  }
  if (service.startsInBackground) {
    steps.push({title: service.id === 'docker' ? 'Start Docker container' : 'Set up service', run: () => wait(1000)});
    steps.push({title: 'Check server', run: async () => {
      await wait(1500);
      if (failure === 'check') {
        fakeLog(logFile, ['Error: listen EADDRINUSE: address already in use :::' + answers.port]);
        throw new Error(`The server does not answer on http://localhost:${answers.port}/ (demo)`);
      }
    }});
  }
  return steps;
}

/** Date a number of days back, as git shows it (YYYY-MM-DD) */
function isoDay(daysBack) {
  return new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** Update case of the demo: an installation a few days behind, with an older Rust AI. */
export function demoInstalledState(directory) {
  return {
    directory,
    port: 9090,
    runMode: 'systemd',
    game: {
      commit: '9b7d3f1', date: isoDay(3), latestCommit: 'e41c09a', latestDate: isoDay(0), behind: 7, offline: false,
      // Relative to now, so the demo always shows a few days
      dateMs: Date.now() - 3 * 24 * 60 * 60 * 1000, lastUpdateMs: Date.now() - 3 * 24 * 60 * 60 * 1000 - 60 * 60 * 1000,
      newTitles: [
        'Lobby: show how long ago the last move was',
        'Mobile: bottom sheet for all actions',
        'AI: plan card order over the next generation',
        'Admin: AI opponents get a page of their own',
        'Create game: board preview shows shuffled bonuses',
      ],
    },
    rustAi: {installed: '1.10', available: '1.12', package: {tag: 'rust-ai-1.12'}, hasUpdate: true},
  };
}

/** Same checklist as a real update (update.mjs), with waiting instead of work. */
export function simulatedUpdateSteps(failure, logFile) {
  return [
    {title: 'Update code', run: () => wait(1000)},
    {title: 'Install dependencies', run: (handle) => progressFor(handle, 2000)},
    {title: 'Build game', run: (handle) => {
      if (failure === 'build') {
        fakeLog(logFile, ['> terraforming-mars@1.0.0 build:server', 'npm ERR! code 2']);
      }
      return progressFor(handle, 3000, failure === 'build' ? 0.6 : undefined, '"npm run build" failed with exit code 2 (demo)');
    }},
    {title: 'Update Rust AI', run: (handle) => progressFor(handle, 1500)},
    {title: 'Restart server', run: () => wait(800)},
    {title: 'Check server', run: async () => {
      await wait(1200);
      if (failure === 'check') {
        throw new Error('The server does not answer on http://localhost:9090/ (demo)');
      }
    }},
  ];
}
