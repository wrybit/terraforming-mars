// macOS service via launchd (LaunchAgent): starts at login and after crashes, no admin rights.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {run} from '../commands.mjs';
import {SERVER_ENTRY} from '../constants.mjs';

const LABEL = 'org.terraforming-mars.server';

function escapeXml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function propertyList({directory}) {
  const logFile = path.join(directory, 'db', 'server.log');
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>${LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${escapeXml(process.execPath)}</string>
    <string>${SERVER_ENTRY}</string>
  </array>
  <key>WorkingDirectory</key><string>${escapeXml(directory)}</string>
  <key>EnvironmentVariables</key>
  <dict><key>NODE_ENV</key><string>production</string></dict>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>${escapeXml(logFile)}</string>
  <key>StandardErrorPath</key><string>${escapeXml(logFile)}</string>
</dict>
</plist>
`;
}

function plistPath() {
  return path.join(os.homedir(), 'Library', 'LaunchAgents', `${LABEL}.plist`);
}

export const launchdService = {
  id: 'launchd',
  label: 'Run in the background',
  hint: 'starts when you log in',
  systems: ['mac'],
  unavailableReason: () => undefined,
  startsInBackground: true,
  async install(context) {
    fs.mkdirSync(path.dirname(plistPath()), {recursive: true});
    fs.mkdirSync(path.join(context.directory, 'db'), {recursive: true});
    fs.writeFileSync(plistPath(), propertyList(context));
    const domain = `gui/${os.userInfo().uid}`;
    // Unload an older version first; fails if none is loaded, which is fine
    await run('launchctl', ['bootout', `${domain}/${LABEL}`], {log: context.log}).catch(() => undefined);
    await run('launchctl', ['bootstrap', domain, plistPath()], {log: context.log});
  },
  // Update: kickstart -k stops the running server and starts the new build
  async restart(context) {
    await run('launchctl', ['kickstart', '-k', `gui/${os.userInfo().uid}/${LABEL}`], {log: context.log});
  },
  logHint: 'tail -f db/server.log',
};
