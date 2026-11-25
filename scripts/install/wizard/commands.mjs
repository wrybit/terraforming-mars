// Runs external commands the same way for every step, so failures are reported alike.
// Output goes to the install log, so the checklist on screen stays readable.
import {spawn, spawnSync} from 'node:child_process';
import fs from 'node:fs';

const isWindows = process.platform === 'win32';

/** Does the command work at all (e.g. `docker compose version`)? Silent. */
export function commandWorks(command, args = []) {
  const result = spawnSync(command, args, {stdio: 'ignore', shell: isWindows});
  return result.status === 0;
}

/**
 * Runs a command; throws on a non-zero exit code.
 * With `log` (a file path) the output is appended there, without it the command uses this terminal.
 */
export function run(command, args, {cwd, env, log} = {}) {
  return new Promise((resolve, reject) => {
    const output = log ? fs.openSync(log, 'a') : undefined;
    if (output !== undefined) {
      fs.writeSync(output, `\n$ ${[command, ...args].join(' ')}\n`);
    }
    // npm/npx are .cmd files on Windows and therefore need a shell
    const child = spawn(command, args, {
      cwd,
      env: {...process.env, ...env},
      stdio: output === undefined ? 'inherit' : ['ignore', output, output],
      shell: isWindows,
    });
    const close = () => output !== undefined && fs.closeSync(output);
    child.on('error', (error) => {
      close();
      reject(error);
    });
    child.on('exit', (code) => {
      close();
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`"${command} ${args.join(' ')}" failed with exit code ${code}`));
      }
    });
  });
}

/** Output of a command as text (for short queries like `git --version`). */
export function capture(command, args, {cwd} = {}) {
  const result = spawnSync(command, args, {cwd, encoding: 'utf8', shell: isWindows});
  return result.status === 0 ? result.stdout.trim() : undefined;
}
