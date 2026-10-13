import {expect} from 'chai';
import * as os from 'os';
import * as path from 'path';
import {mkdtempSync, rmSync} from 'fs';
import {pendingUpdateRequest, requestUpdate} from '../../../src/server/admin/dashboard/updateRequest';

describe('updateRequest', () => {
  let folder: string;

  beforeEach(() => {
    folder = mkdtempSync(path.join(os.tmpdir(), 'update-request-'));
  });

  afterEach(() => {
    rmSync(folder, {recursive: true, force: true});
  });

  it('keeps a request until the script takes it, but not forever', () => {
    expect(pendingUpdateRequest(folder, 0)).is.undefined;
    requestUpdate(folder, 1000);
    expect(pendingUpdateRequest(folder, 2000)).deep.eq({requestedAtMs: 1000});
    // Nobody picked it up within ten minutes: no script is watching
    expect(pendingUpdateRequest(folder, 1000 + 11 * 60 * 1000)).is.undefined;
  });
});
