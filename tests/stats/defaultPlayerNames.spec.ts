import {expect} from 'chai';
import * as os from 'os';
import * as path from 'path';
import {mkdtempSync, rmSync, writeFileSync} from 'fs';
import {defaultPlayerNames, forgetDefaultPlayerNamesForTesting} from '../../src/server/stats/defaultPlayerNames';

describe('defaultPlayerNames', () => {
  let folder: string;

  beforeEach(() => {
    forgetDefaultPlayerNamesForTesting();
    folder = mkdtempSync(path.join(os.tmpdir(), 'default-names-'));
  });

  afterEach(() => {
    forgetDefaultPlayerNamesForTesting();
    rmSync(folder, {recursive: true, force: true});
  });

  it('has the colour names and "You" in English and every language', () => {
    writeFileSync(path.join(folder, 'de.json'), JSON.stringify({Blue: 'Blau', You: 'Du', Cancel: 'Abbrechen'}));
    const names = defaultPlayerNames(folder);
    expect(names).to.include.members(['Blue', 'Red', 'You', 'Blau', 'Du']);
    expect(names).not.to.include('Abbrechen');
  });

  it('falls back to English without locale files', () => {
    expect(defaultPlayerNames(path.join(folder, 'missing'))).to.include('Green');
  });
});
