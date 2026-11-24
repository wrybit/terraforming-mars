// What this system offers: OS, CPU, Docker, systemd, free ports, Rust AI release.
// The questions use it so that nothing is offered that can't work here.
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import {commandWorks} from './commands.mjs';
import {REPOSITORY} from './constants.mjs';

function operatingSystem() {
  if (process.platform === 'win32') {
    return 'windows';
  }
  return process.platform === 'darwin' ? 'mac' : 'linux';
}

function architecture() {
  return process.arch === 'arm64' ? 'arm64' : process.arch === 'x64' ? 'x64' : process.arch;
}

/** Name of the system in the release packages: rust-ai-<version>-<system>-<cpu>.tar.gz */
const PACKAGE_SYSTEM = {linux: 'linux', mac: 'macos', windows: 'windows'};

async function fetchRustAiReleases() {
  try {
    const response = await fetch(`https://api.github.com/repos/${REPOSITORY}/releases?per_page=30`, {
      headers: {'Accept': 'application/vnd.github+json'},
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      return [];
    }
    const releases = await response.json();
    return releases.filter((release) => release.tag_name?.startsWith('rust-ai-') && !release.draft);
  } catch {
    // No network or GitHub rate limit: then the Rust AI is simply not offered
    return [];
  }
}

/** Newest release with a package (and its checksum) for this system and CPU; undefined if there is none. */
function findPackage(releases, system, arch) {
  for (const release of releases) {
    const archive = release.assets.find((asset) => asset.name.endsWith(`-${PACKAGE_SYSTEM[system]}-${arch}.tar.gz`));
    const checksum = release.assets.find((asset) => asset.name === `${archive?.name}.sha256`);
    if (archive && checksum) {
      return {tag: release.tag_name, archiveUrl: archive.browser_download_url, archiveName: archive.name, checksumUrl: checksum.browser_download_url};
    }
  }
  return undefined;
}

export async function detectPlatform() {
  const system = operatingSystem();
  const arch = architecture();
  const releases = await fetchRustAiReleases();
  return {
    system,
    arch,
    homeDirectory: os.homedir(),
    hasDocker: commandWorks('docker', ['compose', 'version']),
    hasSystemd: system === 'linux' && fs.existsSync('/run/systemd/system'),
    // Native package for this system, and the Linux one for Docker (the container is Linux on every system)
    rustAiPackages: {native: findPackage(releases, system, arch), docker: findPackage(releases, 'linux', arch)},
  };
}

/** Installation around the wizard, if it was started from an existing checkout. */
export function checkoutAroundWizard(wizardDirectory) {
  // Downloaded by install.sh/.ps1 only to run the wizard: not an installation
  if (process.env.TM_INSTALLER_STANDALONE) {
    return undefined;
  }
  const candidate = path.resolve(wizardDirectory, '..', '..', '..');
  const isCheckout = fs.existsSync(path.join(candidate, 'package.json')) && fs.existsSync(path.join(candidate, '.git'));
  return isCheckout ? candidate : undefined;
}

export function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => server.close(() => resolve(true)));
    server.listen(port);
  });
}
