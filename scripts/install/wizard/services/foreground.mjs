// Run mode "start now in this window": for trying it out, ends with the window.
import {run} from '../commands.mjs';
import {SERVER_ENTRY} from '../constants.mjs';

export const foregroundService = {
  id: 'foreground',
  label: 'Start now in this window',
  hint: 'stops when you close it',
  systems: ['linux', 'mac', 'windows'],
  unavailableReason: () => undefined,
  startsInBackground: false,
  async install({directory}) {
    await run(process.execPath, [SERVER_ENTRY], {cwd: directory, env: {NODE_ENV: 'production'}});
  },
};
