import * as fs from 'fs';
import * as path from 'path';
import {UPDATE_REQUEST_FILE, UpdateRequest} from '../../../common/admin/ServerDashboard';

// The script of the server operator looks for the file every minute and removes it when it starts the update.
// An older request means no script is watching: showing it as waiting would mislead.
const WATCHED_MILLISECONDS = 10 * 60 * 1000;

/** Asks for an update to the newest commit: the game server cannot rebuild itself, the script outside does it. */
export function requestUpdate(dataFolder: string, nowMs: number = Date.now()): UpdateRequest {
  const request: UpdateRequest = {requestedAtMs: nowMs};
  fs.mkdirSync(dataFolder, {recursive: true});
  fs.writeFileSync(path.join(dataFolder, UPDATE_REQUEST_FILE), JSON.stringify(request));
  return request;
}

/** The request still waiting for the script; undefined if there is none or nobody picked it up in time. */
export function pendingUpdateRequest(dataFolder: string, nowMs: number = Date.now()): UpdateRequest | undefined {
  try {
    const request: UpdateRequest = JSON.parse(fs.readFileSync(path.join(dataFolder, UPDATE_REQUEST_FILE), 'utf8'));
    if (typeof request.requestedAtMs !== 'number' || nowMs - request.requestedAtMs > WATCHED_MILLISECONDS) {
      return undefined;
    }
    return request;
  } catch {
    return undefined;
  }
}
