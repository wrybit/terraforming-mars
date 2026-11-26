import * as path from 'path';

/** File name of the bot program: release packages for Windows ship bot.exe, all others bot. */
export function rustBotFileName(platform: string = process.platform): string {
  return platform === 'win32' ? 'bot.exe' : 'bot';
}

// Where the program and its data are (only on servers that installed the Rust AI): by default in the database
// folder, which survives updates of the server image, so installing is unpacking one package there.
// Release builds carry their data inside the program, so the data folder may be missing.
export const RUST_BOT_BINARY = process.env.RUST_BOT_BINARY ?? path.resolve('db', 'rust-ai', rustBotFileName());
export const RUST_BOT_DATA = process.env.RUST_BOT_DATA ?? path.resolve('db', 'rust-ai', 'data');
export const RUST_BOT_EVENTS = process.env.RUST_BOT_EVENTS ?? path.resolve('db', 'rust-bot');
/** The bot's own decisions with every option and search value, one <gameId>.jsonl per game (analysis of human games). */
export const RUST_BOT_DECISIONS = process.env.TM_DECISION_LOG ?? path.resolve('db', 'rust-decisions');

/** Support file shipped with every bot deploy, next to the bot program (common/ai/aiSupportContract.ts). */
export const RUST_AI_SUPPORT_FILE = path.join(path.dirname(RUST_BOT_BINARY), 'rust-ai-support.json');
