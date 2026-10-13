import * as fs from 'fs';

/** Content of a small system file (/proc, /sys); undefined where it does not exist or cannot be read. */
export function readTextFile(file: string): string | undefined {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch {
    return undefined;
  }
}
