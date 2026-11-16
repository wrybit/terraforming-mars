<template>
  <!-- AI players deciding right now: a passing line each with a countdown, replaced by the move's own line -->
  <li v-for="entry in entries" :key="entry.color" :class="['log-ai-thinking', 'log-line--' + entry.color]" role="status">
    <span class="log-ai-thinking-spinner" aria-hidden="true"></span>
    <span class="log-line-content">{{ parts(entry).before }}<span class="log-player" :class="'player_bg_color_' + entry.color">{{ playerName(entry.color) }}</span>{{ parts(entry).after }}<span class="log-ai-thinking-dots" aria-hidden="true"><span>.</span><span>.</span><span>.</span></span></span>
    <span v-if="secondsLeft(entry) > 0" class="log-ai-thinking-countdown">{{ secondsLeft(entry) }}</span>
  </li>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {AiThinkingModel} from '@/common/ai/AiThinking';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {Color} from '@/common/Color';
import {translateText} from '@/client/directives/i18n';

type DataModel = {
  now: number,
  // Local end of the thinking time per seat: counted from the moment the server's answer arrived (no clock sync needed)
  deadlines: Map<string, {text: string, at: number}>,
  timer: number | undefined,
};

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
  data(): DataModel {
    return {now: Date.now(), deadlines: new Map(), timer: undefined};
  },
  watch: {
    entries: {
      immediate: true,
      handler(entries: ReadonlyArray<AiThinkingModel>) {
        const now = Date.now();
        const next = new Map<string, {text: string, at: number}>();
        for (const entry of entries) {
          // The same decision keeps its first deadline: later polls would only shift it by the network delay
          const known = this.deadlines.get(entry.color);
          next.set(entry.color, known?.text === entry.text ? known : {text: entry.text, at: now + entry.remainingMs});
        }
        this.deadlines = next;
        this.now = now;
      },
    },
  },
  mounted() {
    this.timer = window.setInterval(() => this.now = Date.now(), 200);
  },
  unmounted() {
    window.clearInterval(this.timer);
  },
  methods: {
    playerName(color: Color): string {
      return this.players.find((player) => player.color === color)?.name ?? color;
    },
    // The translated text around the player's name ("${0} grübelt")
    parts(entry: AiThinkingModel): {before: string, after: string} {
      const [before, after = ''] = translateText(entry.text).split('${0}');
      return {before, after};
    },
    secondsLeft(entry: AiThinkingModel): number {
      const at = this.deadlines.get(entry.color)?.at ?? 0;
      return Math.ceil((at - this.now) / 1000);
    },
  },
});
</script>
