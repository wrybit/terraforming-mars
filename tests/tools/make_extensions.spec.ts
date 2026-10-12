import {expect} from 'chai';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {extensionNames, localeDirectories, writeExtensionRegistries} from '../../src/tools/make_extensions';

describe('make_extensions', () => {
  it('writes one registry per part, listing the extensions present', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'extensions-'));
    writeExtensionRegistries(dir);
    for (const [file, constant] of [['extensionsCommon.ts', 'COMMON_EXTENSIONS'], ['extensionsServer.ts', 'SERVER_EXTENSIONS'], ['extensionsClient.ts', 'CLIENT_EXTENSIONS']]) {
      const content = fs.readFileSync(path.join(dir, file), 'utf8');
      expect(content).contains(`export const ${constant}`);
      // Every import points at an extension folder that exists in this checkout
      for (const match of content.matchAll(/from '\.\.\/extensions\/([^/]+)\//g)) {
        expect(extensionNames()).to.include(match[1]);
      }
    }
  });

  it('always reads the game locales first', () => {
    expect(localeDirectories()[0]).eq(path.resolve('src/locales'));
  });
});
