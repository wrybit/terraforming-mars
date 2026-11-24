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
