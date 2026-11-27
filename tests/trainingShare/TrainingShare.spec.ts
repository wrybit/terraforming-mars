import {expect} from 'chai';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {GameId} from '../../src/common/Types';
import {TrainingShare} from '../../src/server/trainingShare/TrainingShare';
import {TrainingShareStore} from '../../src/server/trainingShare/TrainingShareStore';
import {TrainingExportError} from '../../src/server/trainingShare/buildTrainingExport';

const GAME = 'g123' as GameId;

describe('TrainingShare', () => {
  let folder: string;
  let store: TrainingShareStore;
  let uploads: Array<{url: string, key: string, size: number}>;
  let failUpload: Error | undefined;
  let failBuild: Error | undefined;
  const previous = {...process.env};

  function share() {
    return new TrainingShare(store, async (url, body, key) => {
      if (failUpload !== undefined) {
        throw failUpload;
      }
      uploads.push({url, key, size: body.length});
    }, async () => {
      if (failBuild !== undefined) {
        throw failBuild;
      }
      return {exportedGameId: 'gabcdefabcdef', compressed: Buffer.from('packed')};
    });
  }

  beforeEach(() => {
    folder = fs.mkdtempSync(path.join(os.tmpdir(), 'training-share-'));
    store = new TrainingShareStore(path.join(folder, 'training-share.json'));
    uploads = [];
    failUpload = undefined;
    failBuild = undefined;
    delete process.env.TRAINING_SHARE_URL;
    delete process.env.TRAINING_SHARE_ANONYMOUS;
  });

  afterEach(() => {
    process.env = {...previous};
    fs.rmSync(folder, {recursive: true, force: true});
  });

  it('sends nothing while sharing is switched off and creates no key', async () => {
    process.env.TRAINING_SHARE = 'off';
    const result = await share().share(GAME);
    expect(result.ok).is.false;
    expect(uploads).is.empty;
    expect(store.exists()).is.false;
    expect(share().status().serverKeyStart).is.undefined;
  });

  it('shares a game once, with the key of this server, to the default receiver', async () => {
    process.env.TRAINING_SHARE = 'manual';
    expect(await share().share(GAME)).deep.eq({ok: true});
    expect(await share().share(GAME)).deep.eq({ok: true});
    expect(uploads).has.length(1);
    expect(uploads[0].url).to.eq('https://terraforming-mars.baiz.org/api/training-upload');
    expect(uploads[0].key).to.match(/^[0-9a-f]{64}$/);
    const status = share().status();
    expect(status.sharedGameIds).deep.eq([GAME]);
    expect(status.serverKeyStart).to.eq(uploads[0].key.slice(0, 8));
    expect(status.anonymous).is.true;
  });

  it('remembers why an upload failed', async () => {
    process.env.TRAINING_SHARE = 'manual';
    failUpload = new Error('The receiver refused the game (HTTP 413).');
    const result = await share().share(GAME);
    expect(result).deep.eq({ok: false, message: 'The receiver refused the game (HTTP 413).'});
    expect(share().status().lastError?.gameId).to.eq(GAME);
  });

  it('shares automatically when nothing is set: the default', async () => {
    delete process.env.TRAINING_SHARE;
    share().onGameFinished(GAME, true);
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(uploads).has.length(1);
    expect(share().status().mode).eq('auto');
  });

  it('automatic: queues finished games with a human, retries failed uploads, drops games that cannot be packed', async () => {
    process.env.TRAINING_SHARE = 'auto';
    failUpload = new Error('offline');
    const service = share();
    service.onGameFinished(GAME, false);
    expect(store.exists()).is.false;
    service.onGameFinished(GAME, true);
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(share().status().pendingGameIds).deep.eq([GAME]);
    failUpload = undefined;
    await share().retryPending();
    expect(share().status().pendingGameIds).is.empty;
    expect(share().status().sharedGameIds).deep.eq([GAME]);

    const other = 'g456' as GameId;
    failBuild = new TrainingExportError('Game g456 is not finished yet.');
    share().onGameFinished(other, true);
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(share().status().pendingGameIds).is.empty;
  });
});
