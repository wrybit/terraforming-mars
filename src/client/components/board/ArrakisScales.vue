<template>
  <!-- Arrakis: vegetation (left) and water storage (right) as animated vector bands, design E6 · Oase+
       (arrakisScaleArt.ts); symbol and name continue each band beyond its top end. The markers of Board.vue stay in
       place underneath (transparent), so the change flash still rings at the current value. -->
  <!-- Big enough for the large circle (centre 353, radius 314 + band): nothing is cut off -->
  <svg class="arrakis-scales" width="720" height="720" viewBox="0 0 720 720" aria-hidden="true">
    <defs>
      <filter :id="glowId" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2.16" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <path v-for="track in tracks" :id="pathId(track.key)" :key="track.key" :d="track.textPath"/>
    </defs>
    <g v-for="track in tracks" :key="track.key" :class="['arrakis-scales__track', 'arrakis-scales__track--' + track.key, {'arrakis-scales__track--full': track.art.full}]">
      <template v-if="track.art.full">
        <!-- Loaded: halo, the whole band in its gradient, solid white edges, a slow shine and the check in the middle -->
        <g :filter="glowUrl">
          <path v-for="(piece, index) in track.art.fill" :key="'fill' + index" class="arrakis-scales__piece" :d="piece.path"
            :stroke="scaleColour(track.key, piece.share)" :stroke-width="FULL_WIDTH"/>
        </g>
        <path class="arrakis-scales__edge arrakis-scales__edge--full" :d="track.art.innerEdge"/>
        <path class="arrakis-scales__edge arrakis-scales__edge--full" :d="track.art.outerEdge"/>
        <path class="arrakis-scales__shine" :style="motion(track.key + '-sweep', 4.5)" pathLength="1" :d="track.art.band" :stroke-width="FULL_WIDTH"/>
      </template>
      <template v-else>
        <!-- Glass band, the faint path of the whole gradient, edges, step dots and numbers -->
        <path class="arrakis-scales__glass" :d="track.art.band" :stroke="track.glow" :stroke-width="SCALE_BAND"/>
        <path v-for="(piece, index) in track.art.ghost" :key="'ghost' + index" class="arrakis-scales__piece arrakis-scales__piece--ghost" :d="piece.path"
          :stroke="scaleColour(track.key, piece.share)" :stroke-width="GHOST_WIDTH"/>
        <path class="arrakis-scales__edge" :d="track.art.innerEdge" :stroke="track.glow"/>
        <path class="arrakis-scales__edge arrakis-scales__edge--outer" :d="track.art.outerEdge" :stroke="track.glow"/>
        <circle v-for="(dot, index) in track.art.dots" :key="'dot' + index" :class="['arrakis-scales__dot', {'arrakis-scales__dot--reached': dot.reached}]"
          :cx="dot.x" :cy="dot.y" :r="dot.reached ? 2.2 : 1.3"/>
        <text v-for="(mark, index) in track.art.numbers" :key="'number' + index" :class="['arrakis-scales__number', {'arrakis-scales__number--reached': mark.reached}]"
          :x="mark.x" :y="mark.y" :transform="`rotate(${mark.rotation} ${mark.x} ${mark.y})`">{{ mark.text }}</text>
        <g :filter="glowUrl">
          <path v-for="(piece, index) in track.art.fill" :key="'fill' + index" class="arrakis-scales__piece" :d="piece.path"
            :stroke="scaleColour(track.key, piece.share)" :stroke-width="FILL_WIDTH"/>
        </g>
      </template>
      <image class="arrakis-scales__symbol" :href="track.symbol" :x="track.symbolAt.x - SYMBOL / 2" :y="track.symbolAt.y - SYMBOL / 2" :width="SYMBOL" :height="SYMBOL" :filter="glowUrl"
        :transform="`rotate(${track.symbolRotation} ${track.symbolAt.x} ${track.symbolAt.y})`"/>
      <text class="arrakis-scales__name">
        <textPath :href="'#' + pathId(track.key)" :startOffset="track.anchor === 'end' ? '100%' : '0%'" :text-anchor="track.anchor" dominant-baseline="central">{{ $t(track.label) }}</textPath>
      </text>
    </g>
  </svg>
  <!-- Halo, check and value capsule move on their own layers (ArrakisMotionPart.vue): animated inside the SVG they redrew
       the whole SVG in every frame -->
  <div class="arrakis-motion-layer" aria-hidden="true">
    <template v-for="track in tracks" :key="track.key">
      <ArrakisMotionPart v-if="track.art.full" motionClass="arrakis-scales__pulse" :motion="motion(track.key + '-halo', 2.2)" v-bind="BOARD_BOX">
        <path class="arrakis-scales__halo" :d="track.art.band" :stroke="track.glow" :filter="glowUrl"/>
      </ArrakisMotionPart>
      <ArrakisMotionPart v-if="track.art.check !== undefined" motionClass="arrakis-scales__breathe" :motion="motion(track.key + '-check', 2.4)"
        v-bind="boxAround(track.art.check, CHECK_BOX)">
        <path class="arrakis-scales__check arrakis-scales__check--shadow" :d="checkPath(track.art.check)"/>
        <path class="arrakis-scales__check" :d="checkPath(track.art.check)" :filter="glowUrl"/>
      </ArrakisMotionPart>
      <ArrakisMotionPart v-if="track.art.capsule !== undefined" motionClass="arrakis-scales__breathe" :motion="motion(track.key + '-capsule', 2.4)"
        v-bind="boxAround(track.art.capsule, CAPSULE_BOX)">
        <g :transform="`rotate(${track.art.capsule.rotation} ${track.art.capsule.x} ${track.art.capsule.y})`">
          <rect class="arrakis-scales__capsule" :x="track.art.capsule.x - 18" :y="track.art.capsule.y - 11.55" width="36" height="23.1" rx="11.55"
            :stroke="scaleColour(track.key, track.art.capsule.share)" :filter="glowUrl"/>
          <text class="arrakis-scales__value" :x="track.art.capsule.x" :y="track.art.capsule.y">{{ track.art.capsule.text }}</text>
        </g>
      </ArrakisMotionPart>
    </template>
  </div>
  <!-- Particles from the sand to the value, each with its own size, path, pace, colour and blink -->
  <ArrakisParticles :particles="particles"/>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {LARGE_SCALES, SCALE_BAND, STANDARD_SCALES, ScaleGeometry, arcPath, pointAt, scaleColour, scaleLabels} from './arrakisScales';
import {FILL_WIDTH, FULL_WIDTH, FlowPath, GHOST_WIDTH, SCALE_GLOW, ScaleArt, ScaleKey, ScaleValues, scaleArt} from './arrakisScaleArt';
import {BOARD_BOX, MotionBox, MotionStyle, boxAround, desync, whiteTo} from './arrakisMotion';
import {themedAsset} from '@/client/theme/themeDisplay';
import {prefersReducedMotion} from '@/client/utils/motion';
import ArrakisParticles, {ParticleFlow} from './ArrakisParticles.vue';
import ArrakisMotionPart from './ArrakisMotionPart.vue';

type Track = {
  key: ScaleKey,
  label: string,
  art: ScaleArt,
  glow: string,
  symbol: string,
  symbolAt: {x: number, y: number},
  // Turned like the band at its end: the top of the symbol points away from the planet (Jens, 20 Oct 2026)
  symbolRotation: number,
  textPath: string,
  anchor: 'start' | 'end',
};

// Size of the scale symbols in board pixels
const SYMBOL = 42;
// Boxes of the breathing parts (board px): the turned value capsule (36 × 23) and the check, each with its glow
const CAPSULE_BOX = 60;
const CHECK_BOX = 32;
// Ids of the filter and text paths per instance: the board is drawn twice (column and zoom view), and a reference to
// an id inside a hidden copy would draw nothing
let instances = 0;

export default defineComponent({
  name: 'ArrakisScales',
  components: {
    ArrakisParticles,
    ArrakisMotionPart,
  },
  props: {
    // The large Arrakis pins its markers on the bigger circle of the large map (globs.less .global-numbers--large)
    large: {
      type: Boolean,
      default: false,
    },
    vegetation: {
      type: Object as PropType<ScaleValues>,
      required: true,
    },
    water: {
      type: Object as PropType<ScaleValues>,
      required: true,
    },
  },
  data() {
    instances++;
    return {uid: instances};
  },
  computed: {
    geometry(): ScaleGeometry {
      return this.large ? LARGE_SCALES : STANDARD_SCALES;
    },
    SYMBOL(): number {
      return SYMBOL;
    },
    BOARD_BOX(): MotionBox {
      return BOARD_BOX;
    },
    CAPSULE_BOX(): number {
      return CAPSULE_BOX;
    },
    CHECK_BOX(): number {
      return CHECK_BOX;
    },
    SCALE_BAND(): number {
      return SCALE_BAND;
    },
    FILL_WIDTH(): number {
      return FILL_WIDTH;
    },
    FULL_WIDTH(): number {
      return FULL_WIDTH;
    },
    GHOST_WIDTH(): number {
      return GHOST_WIDTH;
    },
    glowId(): string {
      return 'arrakis-scales-glow-' + this.uid;
    },
    glowUrl(): string {
      return `url(#${this.glowId})`;
    },
    // Reduced motion: no moving particles (the CSS animations stop in arrakis_scales.less)
    still(): boolean {
      return prefersReducedMotion();
    },
    tracks(): Array<Track> {
      // The theme turns "Oxygen" and "Temperature" into vegetation and water storage
      const geometry = this.geometry;
      const {vegetation, water} = scaleLabels(geometry);
      return [
        {key: 'vegetation', label: 'Oxygen', art: scaleArt(geometry, 'vegetation', geometry.vegetationAngles, this.vegetation.level, this.vegetation.labels),
          glow: SCALE_GLOW.vegetation, symbol: themedAsset('assets/global-parameters/oxygen.png'), symbolAt: pointAt(geometry, vegetation.symbolAngle), symbolRotation: vegetation.symbolAngle + 90,
          textPath: arcPath(geometry, vegetation.text.from, vegetation.text.to), anchor: vegetation.text.anchor},
        {key: 'water', label: 'Temperature', art: scaleArt(geometry, 'water', geometry.waterAngles, this.water.level, this.water.labels),
          glow: SCALE_GLOW.water, symbol: themedAsset('assets/global-parameters/temperature.png'), symbolAt: pointAt(geometry, water.symbolAngle), symbolRotation: water.symbolAngle + 90,
          textPath: arcPath(geometry, water.text.from, water.text.to), anchor: water.text.anchor},
      ];
    },
    // Particles of both bands for the particle layer
    particles(): Array<ParticleFlow> {
      if (this.still) {
        return [];
      }
      return this.tracks.flatMap((track) => track.art.flow.map((flow: FlowPath): ParticleFlow => ({
        path: flow.path, radius: flow.particle.radius, colour: whiteTo(track.glow, flow.particle.colourShare),
        travel: flow.particle.travel, travelBegin: flow.particle.travelBegin, blink: flow.particle.blink, blinkBegin: flow.particle.blinkBegin,
        opacity: [0.15, 1, 0.15],
      })));
    },
  },
  methods: {
    boxAround,
    scaleColour,
    whiteTo,
    pathId(key: string): string {
      return `arrakis-scale-name-${key}-${this.uid}`;
    },
    motion(key: string, baseSeconds: number): MotionStyle {
      return desync(key, baseSeconds);
    },
    // Check mark, 6.5 board px wide on each side of its centre
    checkPath(at: {x: number, y: number}): string {
      const size = 6.5;
      return `M ${(at.x - size).toFixed(2)} ${at.y.toFixed(2)} l ${(size * 0.7).toFixed(2)} ${(size * 0.7).toFixed(2)} l ${(size * 1.3).toFixed(2)} ${(-size * 1.4).toFixed(2)}`;
    },
  },
});
</script>
