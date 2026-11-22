import {expect} from 'chai';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {RustFallbackLog} from '../../../src/server/ai/rust/rustFallbackLog';

describe('RustFallbackLog', () => {
  let folder: string;
  let warn: typeof console.warn;

  beforeEach(() => {
    folder = fs.mkdtempSync(path.join(os.tmpdir(), 'rust-fallback-log-'));
    warn = console.warn;
    console.warn = () => {};
  });

  afterEach(() => {
    console.warn = warn;
    fs.rmSync(folder, {recursive: true, force: true});
  });

  it('counts the last 24 hours, lists the newest first and survives a restart', () => {
    let now = Date.UTC(2026, 10, 22, 12);
    const file = path.join(folder, 'fallbacks.jsonl');
    const log = new RustFallbackLog(file, () => now);
    log.record({gameId: 'g1', generation: 3, decision: 'card', reason: 'old'});
    now += 25 * 60 * 60 * 1000;
    log.record({gameId: 'g2', generation: 5, decision: 'or', reason: 'new'});
    const summary = new RustFallbackLog(file, () => now).summary();
    expect(summary.last24h).eq(1);
    expect(summary.recent.map((entry) => entry.reason)).deep.eq(['new', 'old']);
  });
});
