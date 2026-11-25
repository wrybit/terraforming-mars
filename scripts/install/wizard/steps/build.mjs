// Installs dependencies and builds server and client – two steps, so the checklist shows where it stands.
import {run} from '../commands.mjs';

export async function installDependencies({directory, log}) {
  await run('npm', ['ci', '--no-audit', '--no-fund'], {cwd: directory, log});
}

export async function buildGame({directory, log}) {
  await run('npm', ['run', 'build'], {cwd: directory, log});
}
