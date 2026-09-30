<template>
  <div class="log-generations">
    <!-- Generationen als Tabs ("nur ansehen", grau) über dem Log; das Log darunter ist die zugehörige Box -->
    <div class="log-gen-title" v-i18n>Gen: </div>
    <!-- Mehr Generationen als Platz: nur die Tabs scrollen waagerecht, "Gen:" bleibt stehen; die gewählte bleibt im Blick -->
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
import {computed, nextTick, onMounted, ref, watch} from 'vue';
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

// Gewählten Tab ins Sichtfeld der Leiste schieben (nur waagerecht; scrollIntoView würde auch die Seite verschieben)
function revealSelected() {
  const bar = tabs.value;
  const tab = bar?.querySelector<HTMLElement>('.or-tab--active');
  if (bar === undefined || tab === null || tab === undefined) {
    return;
  }
  // Lage des Tabs im Scroll-Inhalt der Leiste
  const left = bar.scrollLeft + tab.getBoundingClientRect().left - bar.getBoundingClientRect().left;
  const right = left + tab.offsetWidth;
  if (left < bar.scrollLeft) {
    bar.scrollTo({left, behavior: 'smooth'});
  } else if (right > bar.scrollLeft + bar.clientWidth) {
    bar.scrollTo({left: right - bar.clientWidth, behavior: 'smooth'});
  }
}

onMounted(revealSelected);
watch(() => [props.selected, props.max], () => nextTick(revealSelected));

const range = computed(() => utils.range(props.max + 1).slice(1));

const lastGenerationClass = computed(() => {
  return props.lastSoloGeneration === props.max ? 'last-generation blink-animation' : '';
});

</script>
