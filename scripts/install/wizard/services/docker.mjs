// Docker: uses the existing docker-compose.yml; the wizard only adds .env and the port
// in docker-compose.override.yml, so the repository file stays unchanged and updates run cleanly.
import fs from 'node:fs';
import path from 'node:path';
import {run} from '../commands.mjs';

function overrideFile({port}) {
  return `# Written by the installer – your local settings for docker-compose.yml
services:
  terraforming-mars:
    env_file: .env
    ports: !override
      - "${port}:${port}"
`;
}

export const dockerService = {
  id: 'docker',
  label: 'Run with Docker',
  hint: 'restarts automatically',
  systems: ['linux', 'mac', 'windows'],
  unavailableReason: (platform) => (platform.hasDocker ? undefined : 'docker compose not found'),
  startsInBackground: true,
  // Docker builds inside the container; nothing has to be built locally
  needsLocalBuild: false,
  async install(context) {
    fs.writeFileSync(path.join(context.directory, 'docker-compose.override.yml'), overrideFile(context));
    await run('docker', ['compose', 'up', '-d', '--build'], {cwd: context.directory, log: context.log});
  },
  logHint: 'docker compose logs -f',
};
