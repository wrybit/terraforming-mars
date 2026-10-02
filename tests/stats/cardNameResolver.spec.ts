import {expect} from 'chai';
import * as os from 'os';
import * as path from 'path';
import {mkdtempSync, rmSync, writeFileSync} from 'fs';
import {createCardNameResolver} from '../../src/server/stats/cardNameResolver';

describe('cardNameResolver', () => {
  let folder: string;

  beforeEach(() => {
    folder = mkdtempSync(path.join(os.tmpdir(), 'locales-'));
    writeFileSync(path.join(folder, 'de.json'), JSON.stringify({'Mining Guild': 'Bergbau-Gilde', 'Power': 'Energie', 'Helion': ''}));
  });

  afterEach(() => rmSync(folder, {recursive: true, force: true}));

  it('finds English names regardless of case and translated names', () => {
    const resolve = createCardNameResolver(folder);
    expect(resolve('EcoLine')).eq('Ecoline');
    expect(resolve('Bergbau-Gilde')).eq('Mining Guild');
    expect(resolve('Helion')).eq('Helion');
  });

  it('unknown names and non-card phrases are not cards', () => {
    const resolve = createCardNameResolver(folder);
    expect(resolve('Steam-Version')).is.undefined;
    expect(resolve('Energie')).is.undefined;
  });
});
