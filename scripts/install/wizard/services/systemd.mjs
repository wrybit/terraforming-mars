// Linux service via systemd: starts with the machine and after crashes.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {run} from '../commands.mjs';
import {SERVER_ENTRY, SERVICE_NAME} from '../constants.mjs';

function unitFile({directory}) {
  return `[Unit]
Description=Terraforming Mars
After=network.target

[Service]
WorkingDirectory=${directory}
ExecStart=${process.execPath} ${SERVER_ENTRY}
Environment=NODE_ENV=production
Restart=always
User=${os.userInfo().username}

[Install]
WantedBy=multi-user.target
`;
}

export const systemdService = {
  id: 'systemd',
  systems: ['linux'],
  label: 'Run as a system service',
  hint: 'systemd, needs sudo',
  unavailableReason: (platform) => (platform.hasSystemd ? undefined : 'systemd not found'),
  startsInBackground: true,
  // Asked for before the checklist starts, so the password prompt doesn't collide with it
  needsSudo: true,
  async install(context) {
    // Write to a temporary file first, so only the copy step needs sudo
    const temporaryFile = path.join(os.tmpdir(), `${SERVICE_NAME}.service`);
    fs.writeFileSync(temporaryFile, unitFile(context));
    await run('sudo', ['install', '-m', '644', temporaryFile, `/etc/systemd/system/${SERVICE_NAME}.service`], {log: context.log});
    await run('sudo', ['systemctl', 'daemon-reload'], {log: context.log});
    await run('sudo', ['systemctl', 'enable', SERVICE_NAME], {log: context.log});
    await run('sudo', ['systemctl', 'restart', SERVICE_NAME], {log: context.log});
  },
  logHint: `journalctl -u ${SERVICE_NAME} -f`,
};
