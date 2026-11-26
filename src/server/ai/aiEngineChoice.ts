import {AiAdminSettings, AiEngineDecision, aiEngineFor, aiSettingsOf} from '../../common/ai/aiCompatibility';
import {AiSupport, EMPTY_AI_SUPPORT} from '../../common/ai/aiSupportContract';
import {TYPESCRIPT_AI_SUPPORT} from '../../common/ai/typescript/typescriptAiSupport';
import {BoardName} from '../../common/boards/BoardName';
import {NewGameConfig} from '../../common/game/NewGameConfig';
import {rustAiInstalled} from './rust/RustMirror';
import {rustAiSupportFile} from './rust/rustAiSupportFile';

/**
 * Only the Rust AI plays new games, on every server and without any setting that could change it: settings it cannot
 * play get no AI, and the TypeScript AI never stands in. AI_ENGINE and AI_TYPESCRIPT_FALLBACK in an old .env are ignored.
 */
export const RUST_ONLY: AiAdminSettings = Object.freeze({engine: 'rust', typescriptFallback: false});

export function aiAdminSettings(): AiAdminSettings {
  return RUST_ONLY;
}

let rustAiSupportForTest: AiSupport | undefined = undefined;

/** What the Rust AI of this server plays: nothing without the program, otherwise its support file. */
export function rustAiSupport(): AiSupport {
  if (rustAiSupportForTest !== undefined) {
    return rustAiSupportForTest;
  }
  return rustAiInstalled() ? rustAiSupportFile.get() : EMPTY_AI_SUPPORT;
}

/** for testing: what the Rust AI plays where no Rust program is installed; undefined restores the real check */
export function setRustAiSupportForTest(support: AiSupport | undefined): void {
  rustAiSupportForTest = support;
}

/** Which AI plays a new game with these settings on this server. */
export function decideAiEngine(config: NewGameConfig, boardName: BoardName | undefined): AiEngineDecision {
  return aiEngineFor(aiSettingsOf(config, boardName), {rust: rustAiSupport(), typescript: TYPESCRIPT_AI_SUPPORT}, aiAdminSettings());
}
