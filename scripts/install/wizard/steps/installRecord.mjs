// db/installer.json: how the installer set this installation up, so an update knows how to restart the server.
// db/ is kept by every update (and is the Docker volume), so the record survives.
import fs from 'node:fs';
import path from 'node:path';

function recordFile(directory) {
  return path.join(directory, 'db', 'installer.json');
}

export function writeInstallRecord(directory, {runMode}) {
  fs.mkdirSync(path.dirname(recordFile(directory)), {recursive: true});
  fs.writeFileSync(recordFile(directory), `${JSON.stringify({runMode, updatedAt: new Date().toISOString()}, null, 2)}\n`);
}

export function readInstallRecord(directory) {
  try {
    return JSON.parse(fs.readFileSync(recordFile(directory), 'utf8'));
  } catch {
    return undefined;
  }
}
