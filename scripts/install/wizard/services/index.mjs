// All run modes in one list; new modes are only added here.
import {dockerService} from './docker.mjs';
import {foregroundService} from './foreground.mjs';
import {launchdService} from './launchd.mjs';
import {systemdService} from './systemd.mjs';
import {windowsTaskService} from './windowsTask.mjs';

const installOnly = {
  id: 'none',
  systems: ['linux', 'mac', 'windows'],
  label: 'Only install',
  hint: 'start it yourself later',
  unavailableReason: () => undefined,
  startsInBackground: false,
  async install() {},
};

export const SERVICES = [systemdService, launchdService, windowsTaskService, dockerService, foregroundService, installOnly];

/** Run modes for this OS; foreign ones (e.g. launchd on Linux) are not shown at all. */
export function servicesFor(platform) {
  return SERVICES.filter((service) => service.systems.includes(platform.system));
}

export function serviceById(id) {
  const service = SERVICES.find((candidate) => candidate.id === id);
  if (!service) {
    throw new Error(`Unknown run mode "${id}". Possible: ${SERVICES.map((candidate) => candidate.id).join(', ')}`);
  }
  return service;
}
