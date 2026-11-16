<template>
  <!-- AI players deciding right now: a passing line each, replaced by the move's own line when it arrives -->
  <li v-for="entry in entries" :key="entry.color" :class="['log-ai-thinking', 'log-line--' + entry.color]" role="status">
    <span class="log-ai-thinking-spinner" aria-hidden="true"></span>
    <span class="log-line-content">{{ parts(entry).before }}<span class="log-player" :class="'player_bg_color_' + entry.color">{{ playerName(entry.color) }}</span>{{ parts(entry).after }}</span>
  </li>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {AI_ACTIVITY_TEXT, AiThinkingModel} from '@/common/ai/AiThinking';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {Color} from '@/common/Color';
import {translateText} from '@/client/directives/i18n';

export default defineComponent({
  name: 'LogAiThinking',
  props: {
    entries: {
      type: Array as PropType<ReadonlyArray<AiThinkingModel>>,
      required: true,
    },
    players: {
      type: Array as PropType<ReadonlyArray<PublicPlayerModel>>,
      required: true,
    },
  },
  methods: {
    playerName(color: Color): string {
      return this.players.find((player) => player.color === color)?.name ?? color;
    },
    // The translated text around the player's name ("${0} grübelt…")
    parts(entry: AiThinkingModel): {before: string, after: string} {
      const [before, after = ''] = translateText(AI_ACTIVITY_TEXT[entry.activity]).split('${0}');
      return {before, after};
    },
  },
});
</script>
