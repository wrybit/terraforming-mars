import * as fs from 'fs';
import * as path from 'path';
import {DecisionRecord, setDecisionRecorder} from './decisionTrace';

// Keeps every AI decision of live games (options, their values and the choice) as one
// JSON line per decision in <directory>/<gameId>.jsonl. The game log only says what happened;
// to learn from games against real players the alternatives and their values are needed too.
// Enabled per server via AI_DECISION_LOG_DIR, so only servers that collect training data pay for it.

export function decisionLogFileName(directory: string, gameId: string): string {
  // Game ids come from the server itself, but a path separator must never reach the file system.
  return path.join(directory, `${gameId.replace(/[^A-Za-z0-9_-]/g, '_')}.jsonl`);
}

export function appendDecision(directory: string, record: DecisionRecord): void {
  try {
    fs.appendFileSync(decisionLogFileName(directory, record.gameId), JSON.stringify(record) + '\n');
  } catch (error) {
    // Losing a trace line must never break a running game.
    console.error('Could not write AI decision log', error);
  }
}

export function installDecisionLogFile(directory: string): void {
  fs.mkdirSync(directory, {recursive: true});
  setDecisionRecorder((record) => appendDecision(directory, record));
}
