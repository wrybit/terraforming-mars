<template>
  <div class="log-generations">
    <slot name="title"></slot>
    <!-- Generationen als Tabs ("nur ansehen", grau) über dem Log; das Log darunter ist die zugehörige Box -->
    <div class="log-gen-title" v-i18n>Gen: </div>
    <div class="or-tabs log-gen-tabs" role="tablist">
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
import {computed} from 'vue';
import * as utils from '@/common/utils/utils';

const props = defineProps<{
  max: number;
  selected: number;
  lastSoloGeneration?: number;
}>();

defineEmits<{
  selected: [gen: number];
}>();

const range = computed(() => utils.range(props.max + 1).slice(1));

const lastGenerationClass = computed(() => {
  return props.lastSoloGeneration === props.max ? 'last-generation blink-animation' : '';
});

</script>
