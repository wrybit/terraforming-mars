import {expect} from 'chai';
import * as os from 'os';
import * as path from 'path';
import {mkdirSync, mkdtempSync, rmSync, writeFileSync} from 'fs';
import {PresenceRecord} from '../../../src/server/admin/dashboard/presenceRecord';
import {diskUsage} from '../../../src/server/admin/dashboard/diskUsage';

const at = (day: number, hour: number, minute = 0) => new Date(2026, 9, day, hour, minute).getTime();

describe('PresenceRecord', () => {
  let folder: string;
  let record: PresenceRecord;

  beforeEach(() => {
    folder = mkdtempSync(path.join(os.tmpdir(), 'presence-'));
    record = new PresenceRecord(path.join(folder, 'presence.json'));
  });

  afterEach(() => {
    rmSync(folder, {recursive: true, force: true});
  });

  it('counts each player once per 5-minute slot', () => {
    record.notePlayer('p1', at(13, 20, 1));
    record.notePlayer('p1', at(13, 20, 3));
    record.notePlayer('p2', at(13, 20, 4));
    record.notePlayer('p1', at(13, 20, 6));
    record.flush(at(13, 20, 6));
    // The first flush of a new day starts its row
    record.flush(at(14, 0, 0));
    const profiles = record.profiles(at(14, 0, 0));
    expect(profiles.map((profile) => profile.start)).deep.eq(['2026-10-13', '2026-10-14']);
    // 20:00–20:04 is slot 240, 20:05–20:09 slot 241
    expect(profiles[0].slots[240]).eq(2);
    expect(profiles[0].slots[241]).eq(1);
    expect(profiles[0].slots).has.length(288);
    // Today only up to now
    expect(profiles[1].slots).has.length(1);
  });

  it('records a day without players as zeros, so it lowers the average', () => {
    record.flush(at(13, 9));
    expect(record.profiles(at(13, 23, 59))[0].slots.every((value) => value === 0)).is.true;
  });
});

describe('diskUsage', () => {
  let folder: string;

  beforeEach(() => {
    folder = mkdtempSync(path.join(os.tmpdir(), 'disk-'));
  });

  afterEach(() => {
    rmSync(folder, {recursive: true, force: true});
  });

  it('takes the measurement of the machine when the operator script left one', () => {
    writeFileSync(path.join(folder, 'disk-usage.json'), JSON.stringify({measuredAtMs: 5, docker: 7, game: 1, gameData: 2, logs: 3, aiLogs: 4}));
    expect(diskUsage(folder, undefined)).deep.eq({measuredAtMs: 5, docker: 7, game: 1, gameData: 2, logs: 3, aiLogs: 4});
  });

  it('otherwise measures game data without the AI logs inside the data folder', () => {
    writeFileSync(path.join(folder, 'game.db'), 'x'.repeat(100));
    const decisions = path.join(folder, 'decisions');
    mkdirSync(decisions);
    writeFileSync(path.join(decisions, 'a.jsonl'), 'y'.repeat(30));
    const usage = diskUsage(folder, decisions);
    expect(usage.gameData).eq(100);
    expect(usage.aiLogs).eq(30);
    expect(usage.docker).is.undefined;
  });
});
