import * as childProcess from 'child_process';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import {promisify} from 'util';
import {RustAiUpdateStatus, compareAiVersions} from '../../../common/ai/rustAiUpdate';
import {GitHubRelease, newestRustAiPackage, newestRustAiVersion, rustAiPackageSystem} from './rustAiReleases';
import {UPDATE_FOLDER, swapInUpdate} from './rustAiFolderSwap';
import {RUST_BOT_BINARY} from './rustBotPaths';
import {rustAiSupportFile} from './rustAiSupportFile';

const execFile = promisify(childProcess.execFile);

const RELEASES_URL = 'https://api.github.com/repos/wrybit/terraforming-mars/releases?per_page=30';
/** Every 6 hours: new versions come at most a few times a day, and GitHub allows 60 requests an hour without login */
export const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;
/** First check a minute after the start, so it does not slow the start down */
const FIRST_CHECK_MS = 60 * 1000;

export type RustAiUpdaterOptions = {
  /** Folder of the bot program (db/rust-ai, in Docker /opt/rust-ai) */
  folder: string,
  /** File name of the program in the folder and in the package (bot, bot.exe) */
  binaryName: string,
  /** aiVersion of the installed bot, undefined if there is none */
  installedVersion: () => string | undefined,
  system?: string | undefined,
  fetch?: typeof fetch,
  /** Unpacks a .tar.gz into a folder */
  unpack?: (archive: string, folder: string) => Promise<void>,
  /** Output of "<program> --version"; a package whose program does not answer is not installed */
  programVersion?: (program: string) => Promise<string>,
  now?: () => Date,
};

async function unpackWithTar(archive: string, folder: string): Promise<void> {
  // tar is on every system the server runs on (Linux, macOS, Docker alpine, Windows 10+)
  await execFile('tar', ['-xzf', archive, '-C', folder]);
}

async function versionOfProgram(program: string): Promise<string> {
  return (await execFile(program, ['--version'], {timeout: 15000})).stdout;
}

/**
 * Tells the admin about newer Rust AI releases (rust-ai-<version>, published by the AI's release tool with every
 * deploy) and installs one only when the admin presses the button: servers of other people never change their AI
 * on their own. Checks every 6 hours; installing downloads the package, checks its checksum, asks its program for
 * its version, and only then swaps it in (rustAiFolderSwap.ts). Never installs the Rust AI where
 * there is none, and never goes back to an older version (servers that get newer bots deployed directly stay as they are).
 */
export class RustAiUpdater {
  private status: RustAiUpdateStatus;
  private running: Promise<RustAiUpdateStatus> | undefined;
  private readonly fetch: typeof fetch;
  private readonly unpack: (archive: string, folder: string) => Promise<void>;
  private readonly programVersion: (program: string) => Promise<string>;
  private readonly now: () => Date;
  private readonly system: string | undefined;

  constructor(private readonly options: RustAiUpdaterOptions) {
    this.fetch = options.fetch ?? fetch;
    this.unpack = options.unpack ?? unpackWithTar;
    this.programVersion = options.programVersion ?? versionOfProgram;
    this.now = options.now ?? (() => new Date());
    this.system = 'system' in options ? options.system : rustAiPackageSystem();
    this.status = {state: 'idle'};
  }

  /** Last result, with the installed version */
  public getStatus(): RustAiUpdateStatus {
    return {...this.status, installed: this.options.installedVersion()};
  }

  /** Checks for a newer release; installs it only with install = true (button on the admin page). */
  public check(install = false): Promise<RustAiUpdateStatus> {
    this.running ??= this.run(install).finally(() => {
      this.running = undefined;
    });
    return this.running;
  }

  /** Regular checks while the server runs; they only report, they never install */
  public start(): void {
    setTimeout(() => void this.check(), FIRST_CHECK_MS).unref();
    setInterval(() => void this.check(), CHECK_INTERVAL_MS).unref();
  }

  private set(status: RustAiUpdateStatus): RustAiUpdateStatus {
    this.status = status;
    return this.getStatus();
  }

  private async run(install: boolean): Promise<RustAiUpdateStatus> {
    const installed = this.options.installedVersion();
    if (installed === undefined) {
      return this.set({state: 'not-installed'});
    }
    this.set({...this.status, state: 'checking', error: undefined});
    const checkedAt = this.now().toISOString();
    try {
      const releases = await this.releases();
      const available = newestRustAiVersion(releases);
      if (available === undefined || compareAiVersions(available, installed) <= 0) {
        return this.set({state: 'up-to-date', available, checkedAt});
      }
      const found = this.system === undefined ? undefined : newestRustAiPackage(releases, this.system);
      if (found === undefined) {
        return this.set({state: 'no-package', available, checkedAt});
      }
      if (!this.writable()) {
        return this.set({state: 'read-only', available, checkedAt});
      }
      if (!install) {
        return this.set({state: 'available', available, checkedAt});
      }
      this.set({state: 'installing', available, checkedAt});
      await this.install(found.archiveUrl, found.checksumUrl);
      console.log(`Rust AI updated from ${installed} to ${available}`);
      return this.set({state: 'updated', available, checkedAt});
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`Rust AI update failed: ${message}`);
      return this.set({...this.status, state: 'failed', checkedAt, error: message});
    }
  }

  private async releases(): Promise<Array<GitHubRelease>> {
    const response = await this.fetch(RELEASES_URL, {headers: {Accept: 'application/vnd.github+json'}, signal: AbortSignal.timeout(15000)});
    if (!response.ok) {
      throw new Error(`GitHub answered ${response.status}`);
    }
    return await response.json() as Array<GitHubRelease>;
  }

  private writable(): boolean {
    try {
      fs.accessSync(this.options.folder, fs.constants.W_OK);
      // A read-only mount can still pass the access check on some systems: try for real
      const probe = path.join(this.options.folder, '.write-test');
      fs.writeFileSync(probe, '');
      fs.rmSync(probe);
      return true;
    } catch {
      return false;
    }
  }

  private async download(url: string): Promise<Buffer> {
    const response = await this.fetch(url, {signal: AbortSignal.timeout(5 * 60 * 1000)});
    if (!response.ok) {
      throw new Error(`download answered ${response.status}`);
    }
    return Buffer.from(await response.arrayBuffer());
  }

  private async install(archiveUrl: string, checksumUrl: string): Promise<void> {
    const archive = await this.download(archiveUrl);
    const expected = (await this.download(checksumUrl)).toString('utf8').trim().split(/\s+/)[0];
    const actual = crypto.createHash('sha256').update(archive).digest('hex');
    if (expected !== actual) {
      throw new Error('checksum of the download does not match');
    }
    const update = path.join(this.options.folder, UPDATE_FOLDER);
    fs.rmSync(update, {recursive: true, force: true});
    fs.mkdirSync(update);
    try {
      const archiveFile = path.join(update, 'package.tar.gz');
      fs.writeFileSync(archiveFile, archive);
      await this.unpack(archiveFile, update);
      fs.rmSync(archiveFile);
      const program = path.join(update, this.options.binaryName);
      if (!fs.existsSync(program) || !fs.existsSync(path.join(update, 'rust-ai-support.json'))) {
        throw new Error('the package lacks the program or rust-ai-support.json');
      }
      const answer = await this.programVersion(program);
      if (!answer.startsWith('tm-rust-ai')) {
        throw new Error('the new program does not start on this system');
      }
    } catch (error) {
      fs.rmSync(update, {recursive: true, force: true});
      throw error;
    }
    swapInUpdate(this.options.folder);
  }
}

/** The updater of this server's bot folder (started in server.ts, shown on the admin settings page). */
export const rustAiUpdater = new RustAiUpdater({
  folder: path.dirname(RUST_BOT_BINARY),
  binaryName: path.basename(RUST_BOT_BINARY),
  // A bot without a version in its support file counts as the oldest, so it gets the next release
  installedVersion: () => fs.existsSync(RUST_BOT_BINARY) ? rustAiSupportFile.get().aiVersion ?? '0' : undefined,
});
