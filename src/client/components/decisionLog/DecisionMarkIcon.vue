<template>
  <!-- Coloured mark of an option, the same in the blocks and in the legend; the title explains it on hover -->
  <svg :class="'decision-mark decision-mark--' + mark" width="14" height="14" viewBox="0 0 24 24" role="img" :aria-label="title">
    <title>{{ title }}</title>
    <path v-if="mark === 'best'" d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" />
    <template v-else-if="mark === 'rule'">
      <!-- Rule book: the fixed TS rule of the AI -->
      <path d="M5 3h11a3 3 0 013 3v15H8a3 3 0 01-3-3z" />
      <path class="decision-mark__cut" d="M8.5 7.5h7M8.5 11h7M8.5 14.5h4.5" />
    </template>
    <template v-else>
      <circle cx="12" cy="12" r="10" />
      <path class="decision-mark__cut" d="M7 12.5l3.2 3.2L17 8.8" />
    </template>
  </svg>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {$t} from '@/client/directives/i18n';

/** best: best move of the search; rule: move of the fixed rule; played: the move the AI played */
export type DecisionMark = 'best' | 'rule' | 'played';

export const DECISION_MARK_TITLES: Record<DecisionMark, string> = {
  best: 'Best move of the search',
  rule: 'Move of the fixed rule',
  played: 'Move the AI played',
};

export default defineComponent({
  name: 'DecisionMarkIcon',
  props: {
    mark: {type: String as PropType<DecisionMark>, required: true},
  },
  computed: {
    title(): string {
      return $t(DECISION_MARK_TITLES[this.mark]);
    },
  },
});
</script>
