import {ref} from 'vue';
import {AiThinkingModel} from '@/common/ai/AiThinking';

// AI players deciding right now, from the regular GET /api/waitingfor (WaitingFor.vue); the log shows them
export const aiThinking = ref<ReadonlyArray<AiThinkingModel>>([]);
