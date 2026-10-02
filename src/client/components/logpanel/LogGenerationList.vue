<template>
  <div class="log-generations">
    <!-- Generations as tabs ("view only", gray) above the log; the log below is the associated box -->
    <div class="log-gen-title" v-i18n>Gen: </div>
    <!-- More generations than space: only the tabs scroll horizontally, "Gen:" stays put; the selected one stays in view -->
    <div ref="tabs" class="or-tabs log-gen-tabs" role="tablist">
      <button v-for="n in range" :key="n" type="button" role="tab"
        :aria-selected="n === selected"
        :class="['or-tab', 'or-tab--view', 'or-tab--number', {'or-tab--active': n === selected}]"
        @click.prevent="$emit('selected', n)">
        {{ n }}
      </button>
    </div>
    <span class="label-additional" v-if="lastSoloGeneration !== undefined">
      <span :class="lastGenerationClass" v-i18n>of {{lastSoloGeneration}}</span>
    </span>
  </div>
</template>

<script setup lang="ts">
import {computed, nextTick, onBeforeUnmount, onMounted, ref, watch} from 'vue';
import * as utils from '@/common/utils/utils';

const props = defineProps<{
  max: number;
  selected: number;
  lastSoloGeneration?: number;
}>();

defineEmits<{
  selected: [gen: number];
}>();

const tabs = ref<HTMLElement | undefined>(undefined);

// Scroll the selected tab into view within the bar (horizontally only; scrollIntoView would also move the page)
function revealSelected(behavior: 'smooth' | 'auto' = 'smooth') {
  const bar = tabs.value;
  const tab = bar?.querySelector<HTMLElement>('.or-tab--active');
  if (bar === undefined || tab === null || tab === undefined) {
    return;
  }
  // Position of the tab within the bar's scroll content
  const left = bar.scrollLeft + tab.getBoundingClientRect().left - bar.getBoundingClientRect().left;
  const right = left + tab.offsetWidth;
  if (left < bar.scrollLeft) {
    bar.scrollTo({left, behavior});
  } else if (right > bar.scrollLeft + bar.clientWidth) {
    bar.scrollTo({left: right - bar.clientWidth, behavior});
  }
}

// On mobile the log sits on a hidden screen when loading (width 0): only once it becomes visible
// or its width changes, jump to the selected tab immediately (without animation)
let resizeObserver: ResizeObserver | undefined;
onMounted(() => {
  revealSelected('auto');
  if (typeof ResizeObserver !== 'undefined' && tabs.value !== undefined) {
    resizeObserver = new ResizeObserver(() => revealSelected('auto'));
    resizeObserver.observe(tabs.value);
  }
});
onBeforeUnmount(() => resizeObserver?.disconnect());
watch(() => [props.selected, props.max], () => nextTick(() => revealSelected()));

const range = computed(() => utils.range(props.max + 1).slice(1));

const lastGenerationClass = computed(() => {
  return props.lastSoloGeneration === props.max ? 'last-generation blink-animation' : '';
});

</script>
