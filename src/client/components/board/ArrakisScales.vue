<template>
  <!-- Arrakis: vegetation (left) and water storage (right) as sharp vector bands behind the markers (arrakisScales.ts),
       each with its symbol and name continuing the band beyond its top end -->
  <svg class="arrakis-scales" width="600" height="600" viewBox="0 0 600 600" aria-hidden="true">
    <defs>
      <path v-for="track in tracks" :id="pathId(track.key)" :key="track.key" :d="track.textPath"/>
    </defs>
    <g v-for="track in tracks" :key="track.key" :class="['arrakis-scales__track', 'arrakis-scales__track--' + track.key]">
      <path v-for="step in track.steps" :key="step.index" :d="step.path" :class="['arrakis-scales__step', {'arrakis-scales__step--odd': step.index % 2 === 1}]"/>
      <image class="arrakis-scales__symbol" :href="track.symbol" :x="track.symbolAt.x - SYMBOL / 2" :y="track.symbolAt.y - SYMBOL / 2" :width="SYMBOL" :height="SYMBOL"/>
      <text class="arrakis-scales__name">
        <textPath :href="'#' + pathId(track.key)" :startOffset="track.anchor === 'end' ? '100%' : '0%'" :text-anchor="track.anchor" dominant-baseline="central">{{ $t(track.label) }}</textPath>
      </text>
    </g>
  </svg>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {SCALE_LABELS, SCALE_RADIUS, ScaleStep, VEGETATION_ANGLES, WATER_ANGLES, arcPath, pointAt, scaleSteps} from './arrakisScales';
import {themedAsset} from '@/client/theme/themeDisplay';

type Track = {
  key: keyof typeof SCALE_LABELS,
  label: string,
  steps: Array<ScaleStep>,
  symbol: string,
  symbolAt: {x: number, y: number},
  textPath: string,
  anchor: 'start' | 'end',
};

// Size of the scale symbols in board pixels
const SYMBOL = 32;

export default defineComponent({
  name: 'ArrakisScales',
  computed: {
    SYMBOL(): number {
      return SYMBOL;
    },
    tracks(): Array<Track> {
      // The theme turns "Oxygen" and "Temperature" into vegetation and water storage
      const vegetation = SCALE_LABELS.vegetation;
      const water = SCALE_LABELS.water;
      return [
        {key: 'vegetation', label: 'Oxygen', steps: scaleSteps(VEGETATION_ANGLES),
          symbol: themedAsset('assets/global-parameters/oxygen.png'), symbolAt: pointAt(vegetation.symbolAngle),
          textPath: arcPath(vegetation.text.from, vegetation.text.to, SCALE_RADIUS), anchor: vegetation.text.anchor},
        {key: 'water', label: 'Temperature', steps: scaleSteps(WATER_ANGLES),
          symbol: themedAsset('assets/global-parameters/temperature.png'), symbolAt: pointAt(water.symbolAngle),
          textPath: arcPath(water.text.from, water.text.to, SCALE_RADIUS), anchor: water.text.anchor},
      ];
    },
  },
  methods: {
    pathId(key: string): string {
      return 'arrakis-scale-name-' + key;
    },
  },
});
</script>
