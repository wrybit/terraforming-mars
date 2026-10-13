import {expect} from 'chai';
import * as os from 'os';
import * as path from 'path';
import {mkdtempSync, rmSync} from 'fs';
import {UptimeRecord} from '../../../src/server/admin/dashboard/uptimeRecord';

const at = (day: number, hour: number, minute = 0) => new Date(2026, 9, day, hour, minute).getTime();

describe('UptimeRecord', () => {
  let folder: string;
  let record: UptimeRecord;

  beforeEach(() => {
    folder = mkdtempSync(path.join(os.tmpdir(), 'uptime-'));
    record = new UptimeRecord(path.join(folder, 'uptime.json'));
  });

  afterEach(() => {
    rmSync(folder, {recursive: true, force: true});
  });

  it('has no availability before the first recorded minute', () => {
    expect(record.availability(at(14, 12))).deep.eq([]);
  });

  it('counts running minutes per day as a share of the recorded part of the day', () => {
    record.noteStart(at(13, 0));
    for (let minute = 0; minute < 720; minute++) {
      record.noteRunningMinute(at(13, 0, minute));
    }
    // Today: 60 of the 60 minutes so far
    for (let minute = 0; minute < 60; minute++) {
      record.noteRunningMinute(at(14, 0, minute));
    }
    expect(record.availability(at(14, 1))).deep.eq([{start: '2026-10-13', value: 50}, {start: '2026-10-14', value: 100}]);
  });

  it('does not count the time before the recording started as downtime', () => {
    record.noteStart(at(13, 23));
    for (let minute = 0; minute < 30; minute++) {
      record.noteRunningMinute(at(13, 23, minute));
    }
    expect(record.availability(at(13, 23, 30))).deep.eq([{start: '2026-10-13', value: 100}]);
  });

  it('keeps the latest starts first', () => {
    record.noteStart(at(13, 8));
    record.noteStart(at(14, 9));
    expect(record.read().starts).deep.eq([new Date(at(14, 9)).toISOString(), new Date(at(13, 8)).toISOString()]);
  });
});
