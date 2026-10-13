import * as fs from 'fs';
import * as path from 'path';

/**
 * Measurements of the machine that only a script outside the container can take (disk by purpose, processor and
 * memory by area) land as JSON files in the data folder. Undefined if the file is missing, broken or older than
 * maxAgeMilliseconds (the script stopped: old numbers would mislead).
 */
export function readOperatorFile<T extends {measuredAtMs: number}>(dataFolder: string, fileName: string, maxAgeMilliseconds: number, nowMs: number = Date.now()): T | undefined {
  try {
    const measured: T = JSON.parse(fs.readFileSync(path.join(dataFolder, fileName), 'utf8'));
    if (typeof measured.measuredAtMs !== 'number' || nowMs - measured.measuredAtMs > maxAgeMilliseconds) {
      return undefined;
    }
    return measured;
  } catch {
    return undefined;
  }
}
