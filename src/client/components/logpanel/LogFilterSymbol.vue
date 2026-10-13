<template>
  <span v-if="option.group === 'sign'" class="log-filter-sign">{{ option.value === '1' ? '+' : '−' }}</span>
  <i v-else-if="option.group === 'kind' && option.value === 'action'" class="log-row-action log-filter-arrow"></i>
  <svg v-else-if="option.group === 'kind' && option.value === 'ma'" class="log-filter-trophy" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M7 3h10v3a5 5 0 0 1-10 0zM5 4H3v2a4 4 0 0 0 4 4M19 4h2v2a4 4 0 0 1-4 4M10 13h4v3h3v4H7v-4h3z"/>
  </svg>
  <!-- Small card in its type colour with a sign; standard projects lie across like in the game -->
  <span v-else-if="option.group === 'kind' || option.group === 'type'" :class="['log-filter-card', 'log-filter-card--' + option.value]"><i></i></span>
  <i v-else-if="isTile" :class="['log-effect-icon', 'log-effect-tile--' + option.value]"></i>
  <i v-else :class="['log-effect-icon', 'log-effect-resource--' + option.value]"></i>
</template>

<!-- Symbol of a filter option, the same in the option row and in the chip -->
<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {LogFilterOption} from '@/client/components/logpanel/logFilter';

export default defineComponent({
  name: 'LogFilterSymbol',
  props: {
    option: {
      type: Object as PropType<LogFilterOption>,
      required: true,
    },
  },
  computed: {
    isTile(): boolean {
      return ['city', 'greenery', 'ocean', 'special'].includes(this.option.value);
    },
  },
});
</script>
