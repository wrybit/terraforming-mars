import {ref} from 'vue';
import {paths} from '@/common/app/paths';
import {AiSupportModel} from '@/common/models/AiSupportModel';
import {parseAiSupport} from '@/common/ai/aiSupportContract';

// Which AI plays new games on this server and what the Rust AI can play (GET api/ai-support). Undefined until the
// answer is there: the create form then shows no marks and checks with the TypeScript AI; the server decides.
export const aiSupportInfo = ref<AiSupportModel | undefined>(undefined);

let loading: Promise<void> | undefined;

/** Fetches the answer once per page; later calls reuse it. */
export function loadAiSupport(): Promise<void> {
  loading ??= (async () => {
    try {
      const response = await fetch(paths.API_AI_SUPPORT);
      if (response.ok) {
        const model = await response.json() as AiSupportModel;
        aiSupportInfo.value = {
          engine: model.engine === 'rust' ? 'rust' : 'typescript',
          typescriptFallback: model.typescriptFallback !== false,
          rust: parseAiSupport(model.rust).support,
        };
      }
    } catch {
      // No answer: stays unknown, the server decides
    }
  })();
  return loading;
}

/** for testing */
export function resetAiSupport(): void {
  loading = undefined;
  aiSupportInfo.value = undefined;
}
