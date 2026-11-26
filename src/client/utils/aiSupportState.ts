import {ref} from 'vue';
import {paths} from '@/common/app/paths';
import {AiSupportModel} from '@/common/models/AiSupportModel';
import {parseAiSupport} from '@/common/ai/aiSupportContract';

// Which AI plays new games on this server and what the Rust AI can play (GET api/ai-support). Undefined until the
// answer is there: the create form then shows no marks (the Rust AI counts as knowing nothing); the server decides.
export const aiSupportInfo = ref<AiSupportModel | undefined>(undefined);

let loading: Promise<void> | undefined;

/** Fetches the answer once per page; later calls reuse it. */
export function loadAiSupport(cache: 'default' | 'reload' = 'default'): Promise<void> {
  loading ??= (async () => {
    try {
      const response = await fetch(paths.API_AI_SUPPORT, {cache});
      if (response.ok) {
        const model = await response.json() as AiSupportModel;
        aiSupportInfo.value = {
          // Only the Rust AI plays, whatever an older server answers
          engine: 'rust',
          typescriptFallback: false,
          rust: parseAiSupport(model.rust).support,
        };
      }
    } catch {
      // No answer: stays unknown, the server decides
    }
  })();
  return loading;
}

/** Fetches again past the browser cache (the answer may be a minute old), e.g. after the Rust AI updated itself. */
export function reloadAiSupport(): Promise<void> {
  loading = undefined;
  return loadAiSupport('reload');
}

/** for testing */
export function resetAiSupport(): void {
  loading = undefined;
  aiSupportInfo.value = undefined;
}
