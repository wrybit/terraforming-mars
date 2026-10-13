import * as path from 'path';
import {DashboardDiskUsage, DISK_USAGE_FILE} from '../../../common/admin/ServerDashboard';
import {sizeOnDisk} from './systemMetrics';
import {readOperatorFile} from './operatorFile';

/**
 * Disk usage by purpose. The machine-wide parts (Docker, logs, system) are only visible outside the container:
 * a script of the server operator measures them and drops DISK_USAGE_FILE into the data folder. Without it the
 * server measures what it can see itself, its game data and AI logs.
 */
export function diskUsage(dataFolder: string, decisionLogFolder: string | undefined): DashboardDiskUsage {
  // Measured every 15 minutes: an hour gives room for a slow or skipped run
  const measured = readOperatorFile<DashboardDiskUsage>(dataFolder, DISK_USAGE_FILE, 60 * 60 * 1000);
  if (measured !== undefined) {
    return measured;
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
