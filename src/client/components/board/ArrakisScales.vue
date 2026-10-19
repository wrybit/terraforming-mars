<template>
  <!-- Arrakis: vegetation (left) and water storage (right) as sharp vector bands behind the markers (arrakisScales.ts) -->
  <svg class="arrakis-scales" width="600" height="600" viewBox="0 0 600 600" aria-hidden="true">
    <g class="arrakis-scales__track arrakis-scales__track--vegetation">
      <path v-for="step in vegetation" :key="step.index" :d="step.path" :class="['arrakis-scales__step', {'arrakis-scales__step--odd': step.index % 2 === 1}]"/>
    </g>
    <g class="arrakis-scales__track arrakis-scales__track--water">
      <path v-for="step in water" :key="step.index" :d="step.path" :class="['arrakis-scales__step', {'arrakis-scales__step--odd': step.index % 2 === 1}]"/>
    </g>
  </svg>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {ScaleStep, VEGETATION_ANGLES, WATER_ANGLES, scaleSteps} from './arrakisScales';

export default defineComponent({
  name: 'ArrakisScales',
  computed: {
    vegetation(): Array<ScaleStep> {
      return scaleSteps(VEGETATION_ANGLES);
    },
    water(): Array<ScaleStep> {
      return scaleSteps(WATER_ANGLES);
    },
  },
});
</script>
