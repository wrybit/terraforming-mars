import {AiAdminSettings} from '../ai/aiCompatibility';
import {AiSupport} from '../ai/aiSupportContract';

/** Answer of GET api/ai-support: the admin's choice of AI and what the Rust AI of this server plays. */
export type AiSupportModel = AiAdminSettings & {
  rust: AiSupport;
};
