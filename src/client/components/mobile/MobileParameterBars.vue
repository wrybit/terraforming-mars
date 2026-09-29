<template>
  <!-- Globale Parameter als Balken unter dem Mars (statt der Skalen rund um das Brett) -->
  <div class="mb-params">
    <div v-for="bar in bars" :key="bar.key" :class="['mb-param', 'mb-param--' + bar.key, {'mb-param--done': bar.done}]">
      <span class="mb-param-label">
        <img :src="bar.icon" alt="">
        <span>{{ $t(bar.label) }}</span>
      </span>
      <span class="mb-param-track" role="meter" :aria-label="$t(bar.label)" :aria-valuemin="bar.min" :aria-valuemax="bar.max" :aria-valuenow="bar.value">
        <span class="mb-param-fill" :style="{width: bar.percent + '%'}"></span>
        <!-- Bonus-Schwellen wie auf dem Brett (Wärmeproduktion, Ozean, Temperaturschritt …) -->
        <span v-for="bonus in bar.bonuses" :key="bonus.at"
          :class="['mb-param-bonus', 'mb-param-bonus--' + bonus.kind, {'mb-param-bonus--reached': bar.value >= bonus.at}]"
          :style="{left: bonus.percent + '%'}"
          :title="$t(bonus.title)"></span>
      </span>
      <span class="mb-param-value">{{ bar.text }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import {parameterBars} from '@/client/components/mobile/parameterBars';

const props = defineProps<{
  temperature: number;
  oxygen: number;
  oceans: number;
  venus: number | undefined;
}>();

const bars = computed(() => parameterBars(props));
</script>
