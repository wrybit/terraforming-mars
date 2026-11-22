import {AiAdminSettings, AiEngineDecision, aiEngineFor, aiSettingsOf} from '../../common/ai/aiCompatibility';
import {AiSupport, EMPTY_AI_SUPPORT} from '../../common/ai/aiSupportContract';
import {TYPESCRIPT_AI_SUPPORT} from '../../common/ai/typescript/typescriptAiSupport';
import {BoardName} from '../../common/boards/BoardName';
import {NewGameConfig} from '../../common/game/NewGameConfig';
import {rustAiInstalled} from './rust/RustMirror';
import {rustAiSupportFile} from './rust/rustAiSupportFile';

/** Admin settings of the AI, read at every call (they take effect without a restart). */
export function aiAdminSettings(): AiAdminSettings {
  return {
    engine: process.env.AI_ENGINE === 'rust' ? 'rust' : 'typescript',
    typescriptFallback: process.env.AI_TYPESCRIPT_FALLBACK !== 'false',
  };
}

/** What the Rust AI of this server plays: nothing without the program, otherwise its support file. */
export function rustAiSupport(): AiSupport {
  return rustAiInstalled() ? rustAiSupportFile.get() : EMPTY_AI_SUPPORT;
}

/** Which AI plays a new game with these settings on this server. */
export function decideAiEngine(config: NewGameConfig, boardName: BoardName | undefined): AiEngineDecision {
  return aiEngineFor(aiSettingsOf(config, boardName), {rust: rustAiSupport(), typescript: TYPESCRIPT_AI_SUPPORT}, aiAdminSettings());
}
