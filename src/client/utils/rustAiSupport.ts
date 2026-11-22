import {ref} from 'vue';
import {paths} from '@/common/app/paths';
import {RustAiSupport, parseRustAiSupport} from '@/common/ai/RustAiSupport';

// What the new AI of this server can play (GET api/rust-ai-support). Undefined until the answer is there: the
// create form then shows no marks and keeps New β selectable, the server checks again when the game is created.
export const rustAiSupport = ref<RustAiSupport | undefined>(undefined);

let loading: Promise<void> | undefined;

/** Fetches the support once per page; later calls reuse the answer. */
export function loadRustAiSupport(): Promise<void> {
  loading ??= (async () => {
    try {
      const response = await fetch(paths.API_RUST_AI_SUPPORT);
      if (response.ok) {
        rustAiSupport.value = parseRustAiSupport(await response.json()).support;
      }
    } catch {
      // No answer: stays unknown, the server decides
    }
  })();
  return loading;
}

/** for testing */
export function resetRustAiSupport(): void {
  loading = undefined;
  rustAiSupport.value = undefined;
}
