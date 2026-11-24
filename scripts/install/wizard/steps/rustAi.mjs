// Downloads the Rust AI from the GitHub release, checks the checksum and unpacks it to db/rust-ai/.
// Only the ready program; the source code is not public.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {run} from '../commands.mjs';

async function download(url) {
  const response = await fetch(url, {signal: AbortSignal.timeout(120000)});
  if (!response.ok) {
    throw new Error(`Download failed (${response.status}): ${url}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

export async function installRustAi({directory, log}, release) {
  const archive = await download(release.archiveUrl);
  const expected = (await download(release.checksumUrl)).toString('utf8').trim().split(/\s+/)[0];
  const actual = crypto.createHash('sha256').update(archive).digest('hex');
  if (expected !== actual) {
    throw new Error('Checksum of the Rust AI does not match – download aborted.');
  }
  const target = path.join(directory, 'db', 'rust-ai');
  fs.mkdirSync(target, {recursive: true});
  const archivePath = path.join(directory, 'db', release.archiveName);
  fs.writeFileSync(archivePath, archive);
  await run('tar', ['-xzf', archivePath, '-C', target], {log});
  fs.rmSync(archivePath);
}
