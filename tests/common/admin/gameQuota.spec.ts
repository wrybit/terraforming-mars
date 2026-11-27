import {expect} from 'chai';
import {formatGameQuota, parseGameQuota} from '../../../src/common/admin/gameQuota';
import {isValidSettingValue} from '../../../src/common/admin/isValidSettingValue';
import {SERVER_SETTINGS} from '../../../src/common/admin/serverSettings';
import {durationToMilliseconds} from '../../../src/server/utils/durations';

const QUOTA = SERVER_SETTINGS.find((setting) => setting.key === 'GAME_QUOTA')!;

describe('gameQuota', () => {
  it('reads a single limit and a list, in the largest even unit', () => {
    expect(parseGameQuota('{"limit":3,"per":"10m"}')).deep.eq([{games: 3, amount: 10, unit: 'm'}]);
    expect(parseGameQuota('[{"limit":5,"per":"10m"},{"limit":30,"per":"1d"}]')).deep.eq([
      {games: 5, amount: 10, unit: 'm'},
      {games: 30, amount: 1, unit: 'd'},
    ]);
    expect(parseGameQuota('{"limit":"4","per":"1h30m"}')).deep.eq([{games: 4, amount: 90, unit: 'm'}]);
    expect(parseGameQuota('{"limit":2,"per":"120m"}')).deep.eq([{games: 2, amount: 2, unit: 'h'}]);
  });

  it('empty means unlimited, unreadable values are reported', () => {
    expect(parseGameQuota('')).deep.eq([]);
    expect(parseGameQuota('{"limit":3}')).is.undefined;
    expect(parseGameQuota('{"limit":3,"per":"soon"}')).is.undefined;
    expect(parseGameQuota('not json')).is.undefined;
  });

  it('writes what the server reads: same limits, same time spans', () => {
    const value = formatGameQuota([{games: 5, amount: 10, unit: 'm'}, {games: 30, amount: 1, unit: 'd'}]);
    expect(value).eq('[{"limit":5,"per":"10m"},{"limit":30,"per":"1d"}]');
    const written = JSON.parse(value) as Array<{per: string}>;
    expect(written.map((entry) => durationToMilliseconds(entry.per))).deep.eq([10 * 60 * 1000, 24 * 60 * 60 * 1000]);
    expect(formatGameQuota([])).eq('');
  });

  it('is shown as rows and saved only with whole numbers', () => {
    expect(QUOTA.kind).eq('quota');
    expect(isValidSettingValue(QUOTA, '[{"limit":5,"per":"10m"}]')).is.true;
    expect(isValidSettingValue(QUOTA, '[{"limit":5,"per":"0m"}]')).is.false;
    expect(isValidSettingValue(QUOTA, '[{"limit":null,"per":"10m"}]')).is.false;
    expect(isValidSettingValue(QUOTA, '{"limit":3')).is.false;
    expect(isValidSettingValue(QUOTA, '')).is.true;
  });
});
