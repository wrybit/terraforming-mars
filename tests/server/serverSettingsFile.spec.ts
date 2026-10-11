import {expect} from 'chai';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {applyServerSettings, readServerSettings, writeServerSettings} from '../../src/server/admin/serverSettingsFile';

describe('serverSettingsFile', () => {
  let directory: string;
  let file: string;
  let previousFile: string | undefined;

  beforeEach(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'server-settings-'));
    file = path.join(directory, '.env');
    previousFile = process.env.SERVER_SETTINGS_FILE;
    process.env.SERVER_SETTINGS_FILE = file;
  });

  afterEach(() => {
    if (previousFile === undefined) {
      delete process.env.SERVER_SETTINGS_FILE;
    } else {
      process.env.SERVER_SETTINGS_FILE = previousFile;
    }
    fs.rmSync(directory, {recursive: true, force: true});
  });

  const value = (key: string) => readServerSettings().settings.find((setting) => setting.key === key)?.value;

  it('saves values and reads them back, also with quotes and spaces', () => {
    writeServerSettings({GAME_QUOTA: '{"limit":3,"per":"10m"}', SERVER_NAME: 'Jens\' Server', TITLE_LONG: 'TM | Meenzer-Server'});
    expect(value('GAME_QUOTA')).eq('{"limit":3,"per":"10m"}');
    expect(value('SERVER_NAME')).eq('Jens\' Server');
    expect(value('TITLE_LONG')).eq('TM | Meenzer-Server');
  });

  it('changes only its own lines of an existing .env file', () => {
    fs.writeFileSync(file, '# Comment\nSERVER_ID=abc\nMAX_GAME_DAYS=1\nOTHER=x\nMAX_GAME_DAYS=2\n');
    writeServerSettings({MAX_GAME_DAYS: '7', SERVER_NAME: 'Probe'});
    expect(fs.readFileSync(file, 'utf8')).eq('# Comment\nSERVER_ID=abc\nMAX_GAME_DAYS=\'7\'\nOTHER=x\nSERVER_NAME=\'Probe\'\n');
  });

  it('removes the line for an empty value or null', () => {
    fs.writeFileSync(file, 'SERVER_NAME=Probe\nMAX_GAME_DAYS=1\n');
    writeServerSettings({SERVER_NAME: '', MAX_GAME_DAYS: null});
    expect(fs.readFileSync(file, 'utf8')).eq('\n');
    expect(value('SERVER_NAME')).is.undefined;
  });

  it('refuses unknown keys', () => {
    expect(() => writeServerSettings({PATH: '/tmp'})).to.throw('unknown setting PATH');
  });

  it('applies the file, but keeps the variables the process was started with', () => {
    fs.writeFileSync(file, 'TM_TEST_LAUNCH=fromFile\nTM_TEST_FILE=fromFile\n');
    process.env.TM_TEST_LAUNCH = 'fromLaunch';
    process.env.TM_TEST_FILE = 'fromDotenv';
    try {
      applyServerSettings(new Set(['TM_TEST_LAUNCH']));
      expect(process.env.TM_TEST_LAUNCH).eq('fromLaunch');
      expect(process.env.TM_TEST_FILE).eq('fromFile');
    } finally {
      delete process.env.TM_TEST_LAUNCH;
      delete process.env.TM_TEST_FILE;
    }
  });
});
