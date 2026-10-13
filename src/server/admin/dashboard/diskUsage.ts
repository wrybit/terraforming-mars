import * as fs from 'fs';
import * as path from 'path';
import {DashboardDiskUsage, DISK_USAGE_FILE} from '../../../common/admin/ServerDashboard';
import {sizeOnDisk} from './systemMetrics';

/**
 * Disk usage by purpose. The machine-wide parts (Docker, logs, system) are only visible outside the container:
 * a script of the server operator measures them and drops DISK_USAGE_FILE into the data folder. Without it the
 * server measures what it can see itself, its game data and AI logs.
 */
export function diskUsage(dataFolder: string, decisionLogFolder: string | undefined): DashboardDiskUsage {
  try {
    const measured: DashboardDiskUsage = JSON.parse(fs.readFileSync(path.join(dataFolder, DISK_USAGE_FILE), 'utf8'));
    if (typeof measured.measuredAtMs === 'number') {
      return measured;
    }
  } catch {
    // No file (development, other hosting): measure below
  }
  const aiLogs = decisionLogFolder ? sizeOnDisk(decisionLogFolder) : undefined;
  const dataBytes = sizeOnDisk(dataFolder);
  const aiLogsInside = decisionLogFolder !== undefined && path.resolve(decisionLogFolder).startsWith(path.resolve(dataFolder) + path.sep);
  return {
    measuredAtMs: Date.now(),
    gameData: dataBytes === undefined ? undefined : dataBytes - (aiLogsInside ? aiLogs ?? 0 : 0),
    aiLogs,
  };
}
