<template>
  <div class="mb-params">
    <!-- Global parameters as bars below Mars (instead of the scales around the board) -->
    <div v-for="bar in bars" :key="bar.key" :class="['mb-param', 'mb-param--' + bar.key, {'mb-param--done': bar.done}]">
      <span class="mb-param-label">
        <img :src="bar.icon" alt="">
        <span>{{ $t(bar.label) }}</span>
      </span>
      <span class="mb-param-track" :style="{'--steps': bar.steps}" role="meter" :aria-label="$t(bar.label)" :aria-valuemin="bar.min" :aria-valuemax="bar.max" :aria-valuenow="bar.value">
        <!-- Level as a CSS variable instead of width/left: mobile.less lays the bar horizontally or vertically per orientation -->
        <span class="mb-param-fill" :style="{'--percent': bar.percent + '%'}" v-flash="flashKeys.globalParameter(bar.key)"></span>
        <!-- Bonus thresholds as on the board (heat production, ocean, temperature step …) -->
        <span v-for="bonus in bar.bonuses" :key="bonus.at"
          :class="['mb-param-bonus', 'mb-param-bonus--' + bonus.kind, {'mb-param-bonus--reached': bar.value >= bonus.at}]"
          :style="{'--percent': bonus.percent + '%'}"
          :title="$t(bonus.title)"></span>
      </span>
      <span class="mb-param-value" v-flash="flashKeys.globalParameter(bar.key)">{{ bar.text }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import {parameterBars} from '@/client/components/mobile/parameterBars';
import {vFlash} from '@/client/directives/ChangeFlash';
import {flashKeys} from '@/client/utils/changeFlashKeys';

const props = defineProps<{
  temperature: number;
  oxygen: number;
  oceans: number;
  venus: number | undefined;
}>();

const bars = computed(() => parameterBars(props));
</script>
