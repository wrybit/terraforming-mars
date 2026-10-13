import {expect} from 'chai';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {ServerLogoStore} from '../../../src/server/admin/serverLogoStore';

describe('ServerLogoStore', () => {
  let folder: string;
  let store: ServerLogoStore;

  beforeEach(() => {
    folder = fs.mkdtempSync(path.join(os.tmpdir(), 'server-logo-'));
    store = new ServerLogoStore(folder);
  });

  afterEach(() => {
    fs.rmSync(folder, {recursive: true, force: true});
  });

  it('saves an image under its content hash and serves it again', () => {
    const data = Buffer.from('fake png');
    const address = store.save(data, 'image/png');
    expect(address).matches(/^api\/admin\/server-logo\?file=logo-[0-9a-f]{16}\.png$/);
    const fileName = address!.split('file=')[1];
    expect(store.get(fileName)).deep.eq({data, contentType: 'image/png'});
    // Same content, same address
    expect(store.save(data, 'image/png')).eq(address);
  });

  it('refuses SVG and other types', () => {
    expect(store.save(Buffer.from('<svg/>'), 'image/svg+xml')).is.undefined;
  });

  it('serves nothing for foreign or missing file names', () => {
    expect(store.get('../game.db')).is.undefined;
    expect(store.get('logo-0123456789abcdef.png')).is.undefined;
  });
});
