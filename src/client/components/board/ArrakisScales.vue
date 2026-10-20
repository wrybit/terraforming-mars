<template>
  <!-- Arrakis: vegetation (left) and water storage (right) as sharp vector bands behind the markers (arrakisScales.ts),
       each with its symbol and name continuing the band beyond its top end -->
  <!-- Big enough for the large circle (centre 353, radius 314 + band): nothing is cut off -->
  <svg class="arrakis-scales" width="720" height="720" viewBox="0 0 720 720" aria-hidden="true">
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
import {LARGE_SCALES, STANDARD_SCALES, ScaleGeometry, ScaleStep, arcPath, pointAt, scaleLabels, scaleSteps} from './arrakisScales';
import {themedAsset} from '@/client/theme/themeDisplay';

type Track = {
  key: 'vegetation' | 'water',
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
  props: {
    // The large Arrakis pins its markers on the bigger circle of the large map (globs.less .global-numbers--large)
    large: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    geometry(): ScaleGeometry {
      return this.large ? LARGE_SCALES : STANDARD_SCALES;
    },
    SYMBOL(): number {
      return SYMBOL;
    },
    tracks(): Array<Track> {
      // The theme turns "Oxygen" and "Temperature" into vegetation and water storage
      const geometry = this.geometry;
      const {vegetation, water} = scaleLabels(geometry);
      return [
        {key: 'vegetation', label: 'Oxygen', steps: scaleSteps(geometry, geometry.vegetationAngles),
          symbol: themedAsset('assets/global-parameters/oxygen.png'), symbolAt: pointAt(geometry, vegetation.symbolAngle),
          textPath: arcPath(geometry, vegetation.text.from, vegetation.text.to), anchor: vegetation.text.anchor},
        {key: 'water', label: 'Temperature', steps: scaleSteps(geometry, geometry.waterAngles),
          symbol: themedAsset('assets/global-parameters/temperature.png'), symbolAt: pointAt(geometry, water.symbolAngle),
          textPath: arcPath(geometry, water.text.from, water.text.to), anchor: water.text.anchor},
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
