import {randomBytes} from 'crypto';

/**
 * Player and spectator ids are the only key to a seat, so they come from a cryptographic source:
 * Math.random can be reconstructed from a few observed values, which would make other ids predictable.
 * Same length as before (12 hex digits, 48 bits), so existing ids and their checks stay valid.
 */
export function generateRandomId(prefix: string): string {
  return prefix + randomBytes(6).toString('hex');
}

export const serverId = process.env.SERVER_ID || generateRandomId('');
export const runId = generateRandomId('r');
