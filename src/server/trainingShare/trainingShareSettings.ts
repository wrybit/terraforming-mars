import * as path from 'path';
import {TRAINING_SHARE_RECEIVER_URL, TrainingShareMode} from '../../common/trainingShare/TrainingShareModel';

// The .env settings of the Export tab (common/admin/serverSettings.ts); read at every use, they take effect at once

/** Automatic unless switched off or to the button: the default shares, so the AI gets the games of every server */
export function trainingShareMode(): TrainingShareMode {
  const mode = process.env.TRAINING_SHARE;
  return mode === 'off' || mode === 'manual' ? mode : 'auto';
}

/** Anonymous unless switched off: the safe choice is the default */
export function trainingShareAnonymous(): boolean {
  const value = (process.env.TRAINING_SHARE_ANONYMOUS ?? '').toLowerCase();
  return value !== 'false' && value !== '0';
}

// No .env key: the receiver is the same for every server, so the games reach the training
export function trainingShareUrl(): string {
  return TRAINING_SHARE_RECEIVER_URL;
}

/**
 * Folder of the decision logs: the AI setting if set, otherwise db/decisions while sharing is on, so that shared
 * games carry the decisions too. Undefined: nothing is recorded.
 */
export function decisionLogDirectory(): string | undefined {
  if (process.env.AI_DECISION_LOG_DIR) {
    return process.env.AI_DECISION_LOG_DIR;
  }
  return trainingShareMode() === 'off' ? undefined : path.resolve(process.cwd(), 'db', 'decisions');
}
