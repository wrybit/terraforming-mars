import {ref} from 'vue';
import {AiThinkingModel} from '@/common/ai/AiThinking';

// AI players deciding right now, from GET /api/waitingfor (WaitingFor.vue) and every player view; the log shows them
export const aiThinking = ref<ReadonlyArray<AiThinkingModel>>([]);

/** A new player view arrived (own move, update after another player's move): it carries the current state */
export function takeAiThinking(model: {aiThinking?: ReadonlyArray<AiThinkingModel>}): void {
  aiThinking.value = model.aiThinking ?? [];
}
