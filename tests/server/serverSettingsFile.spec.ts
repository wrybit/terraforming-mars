import {expect} from 'chai';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {readServerSettings, writeServerSettings} from '../../src/server/admin/serverSettingsFile';

describe('serverSettingsFile', () => {
  let directory: string;
  let previousFile: string | undefined;

  beforeEach(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'server-settings-'));
    previousFile = process.env.SERVER_SETTINGS_FILE;
    process.env.SERVER_SETTINGS_FILE = path.join(directory, 'server-settings.env');
  });

  afterEach(() => {
    if (previousFile === undefined) {
      delete process.env.SERVER_SETTINGS_FILE;
    } else {
      process.env.SERVER_SETTINGS_FILE = previousFile;
    }
    fs.rmSync(directory, {recursive: true, force: true});
  });

  const saved = (key: string) => readServerSettings().settings.find((setting) => setting.key === key)?.saved;

  it('saves values and reads them back, also with quotes and spaces', () => {
    writeServerSettings({GAME_QUOTA: '{"limit":3,"per":"10m"}', SERVER_NAME: 'Jens\' Server', TITLE_LONG: 'TM | Meenzer-Server'});
    expect(saved('GAME_QUOTA')).eq('{"limit":3,"per":"10m"}');
    expect(saved('SERVER_NAME')).eq('Jens\' Server');
    expect(saved('TITLE_LONG')).eq('TM | Meenzer-Server');
  });

  it('keeps an empty value and removes a value with null', () => {
    writeServerSettings({SERVER_NAME: '', MAX_GAME_DAYS: '7'});
    expect(saved('SERVER_NAME')).eq('');
    writeServerSettings({MAX_GAME_DAYS: null});
    expect(saved('MAX_GAME_DAYS')).is.undefined;
    expect(saved('SERVER_NAME')).eq('');
  });

  it('refuses unknown keys', () => {
    expect(() => writeServerSettings({PATH: '/tmp'})).to.throw('unknown setting PATH');
  });
});
