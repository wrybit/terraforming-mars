import {expect} from 'chai';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {RustAiUpdater, RustAiUpdaterOptions} from '../../../src/server/ai/rust/RustAiUpdater';
import {PREVIOUS_FOLDER} from '../../../src/server/ai/rust/rustAiFolderSwap';

const ARCHIVE = Buffer.from('fake package');
const CHECKSUM = crypto.createHash('sha256').update(ARCHIVE).digest('hex');

// GitHub with one release 1.11 for linux-x64; the archive's bytes are ARCHIVE
function fakeGitHub(checksum = CHECKSUM): typeof fetch {
  const name = 'rust-ai-1.11-linux-x64.tar.gz';
  const releases = [{tag_name: 'rust-ai-1.11', assets: [
    {name, browser_download_url: 'https://example.test/archive'},
    {name: `${name}.sha256`, browser_download_url: 'https://example.test/checksum'},
  ]}];
  return (async (url: string | URL | Request) => {
    const address = String(url);
    const body = address.includes('api.github.com') ? JSON.stringify(releases) :
      address.endsWith('/archive') ? ARCHIVE : `${checksum}  ${name}\n`;
    return new Response(body, {status: 200});
  }) as typeof fetch;
}

describe('RustAiUpdater', () => {
  let folder: string;
  let installed: string | undefined;

  function updater(options: Partial<RustAiUpdaterOptions> = {}): RustAiUpdater {
    return new RustAiUpdater({
      folder,
      binaryName: 'bot',
      installedVersion: () => installed,
      system: 'linux-x64',
      fetch: fakeGitHub(),
      // Stand-in for tar: the "package" holds a new program and support file
      unpack: async (_archive, target) => {
        fs.writeFileSync(path.join(target, 'bot'), 'new bot');
        fs.writeFileSync(path.join(target, 'rust-ai-support.json'), '{"aiVersion": "1.11"}');
      },
      programVersion: async () => 'tm-rust-ai 1.11 embedded\n',
      now: () => new Date('2026-11-26T08:00:00Z'),
      ...options,
    });
  }

  beforeEach(() => {
    folder = fs.mkdtempSync(path.join(os.tmpdir(), 'rust-ai-update-'));
    fs.writeFileSync(path.join(folder, 'bot'), 'old bot');
    fs.writeFileSync(path.join(folder, 'rust-ai-support.json'), '{"aiVersion": "1.10"}');
    fs.mkdirSync(path.join(folder, 'data'));
    installed = '1.10';
  });

  afterEach(() => fs.rmSync(folder, {recursive: true, force: true}));

  it('installs a newer release with the button and keeps the old version (with its data folder) aside', async () => {
    const status = await updater().check(true);
    expect(status.state).eq('updated');
    expect(status.available).eq('1.11');
    expect(status.checkedAt).eq('2026-11-26T08:00:00.000Z');
    expect(fs.readFileSync(path.join(folder, 'bot'), 'utf8')).eq('new bot');
    expect(fs.existsSync(path.join(folder, 'data'))).is.false;
    expect(fs.readFileSync(path.join(folder, PREVIOUS_FOLDER, 'bot'), 'utf8')).eq('old bot');
    expect(fs.existsSync(path.join(folder, PREVIOUS_FOLDER, 'data'))).is.true;
    expect(fs.existsSync(path.join(folder, '.update'))).is.false;
  });

  it('only reports a newer release when it checks on its own, never installs it', async () => {
    const subject = updater();
    expect((await subject.check()).state).eq('available');
    expect(fs.readFileSync(path.join(folder, 'bot'), 'utf8')).eq('old bot');
    expect((await subject.check()).state).eq('available');
    expect(fs.readFileSync(path.join(folder, 'bot'), 'utf8')).eq('old bot');
  });

  it('never goes back to an older release', async () => {
    installed = '1.12';
    expect((await updater().check(true)).state).eq('up-to-date');
    expect(fs.readFileSync(path.join(folder, 'bot'), 'utf8')).eq('old bot');
  });

  it('does not install the Rust AI where there is none', async () => {
    installed = undefined;
    expect((await updater().check(true)).state).eq('not-installed');
  });

  it('keeps the old version when the checksum does not match', async () => {
    const status = await updater({fetch: fakeGitHub('0'.repeat(64))}).check(true);
    expect(status.state).eq('failed');
    expect(status.error).contains('checksum');
    expect(fs.readFileSync(path.join(folder, 'bot'), 'utf8')).eq('old bot');
  });

  it('keeps the old version when the new program does not start', async () => {
    const status = await updater({programVersion: async () => {
      throw new Error('spawn ENOEXEC');
    }}).check(true);
    expect(status.state).eq('failed');
    expect(fs.readFileSync(path.join(folder, 'bot'), 'utf8')).eq('old bot');
    expect(fs.existsSync(path.join(folder, '.update'))).is.false;
  });

  it('says so when this system has no package', async () => {
    expect((await updater({system: 'windows-x64'}).check()).state).eq('no-package');
  });
});
