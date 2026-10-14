import {expect} from 'chai';
import {isValidSettingValue} from '../../../src/common/admin/isValidSettingValue';
import {serverSettingDefinition} from '../../../src/common/admin/serverSettings';
import {isUsableDaysSetting} from '../../../src/server/database/utils';

describe('isValidSettingValue', () => {
  const maxGameDays = serverSettingDefinition('MAX_GAME_DAYS')!;
  const port = serverSettingDefinition('PORT')!;
  const serverName = serverSettingDefinition('SERVER_NAME')!;

  it('accepts whole numbers from the minimum on, and empty values', () => {
    expect(isValidSettingValue(maxGameDays, '1')).is.true;
    expect(isValidSettingValue(maxGameDays, '30')).is.true;
    expect(isValidSettingValue(maxGameDays, '')).is.true;
    expect(isValidSettingValue(maxGameDays, null)).is.true;
    expect(isValidSettingValue(port, '0')).is.true;
  });

  it('refuses text, fractions, negative numbers and values below the minimum', () => {
    // "ten" days used to become 0 days, and the hourly clean-up deleted every running game
    for (const value of ['ten', '1.5', '-1', '0', '1e3']) {
      expect(isValidSettingValue(maxGameDays, value), value).is.false;
    }
  });

  it('does not check settings that are not numbers', () => {
    expect(isValidSettingValue(serverName, 'ten')).is.true;
  });
});

describe('isUsableDaysSetting', () => {
  it('skips the clean-up for an invalid number of days', () => {
    expect(isUsableDaysSetting('MAX_GAME_DAYS', {})).is.true;
    expect(isUsableDaysSetting('MAX_GAME_DAYS', {MAX_GAME_DAYS: '2'})).is.true;
    expect(isUsableDaysSetting('MAX_GAME_DAYS', {MAX_GAME_DAYS: 'ten'})).is.false;
    expect(isUsableDaysSetting('COMPRESS_COMPLETED_GAMES_DAYS', {COMPRESS_COMPLETED_GAMES_DAYS: '0'})).is.false;
  });
});
