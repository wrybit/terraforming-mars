<template>
  <!-- Course of the game above the big slider: victory points (TR included) of every player as lines, the milestones and awards (flag/trophy)
       and one dot per raised step of temperature, oxygen and oceans, each exactly at its step. Generation columns are
       as wide as their number of steps, so graph and slider always line up. Everything after the current step is pale. -->
  <div ref="graph" class="replay-timeline" :class="{'replay-timeline--thin': thin}">
    <div class="replay-timeline__fold">
      <div>
        <div class="replay-timeline__lanes">
          <svg class="replay-timeline__tr" :viewBox="`0 0 ${width} ${trHeight}`" preserveAspectRatio="none" aria-hidden="true">
            <line v-for="value in trGrid" :key="value" class="replay-timeline__grid" x1="0" :x2="width" :y1="trY(value)" :y2="trY(value)" />
            <defs>
              <clipPath :id="clipId + '-past'"><rect x="0" y="-10" :width="currentX" :height="trHeight + 20" /></clipPath>
              <clipPath :id="clipId + '-future'"><rect :x="currentX" y="-10" :width="Math.max(0, width - currentX)" :height="trHeight + 20" /></clipPath>
            </defs>
            <template v-for="line in trLines" :key="line.color">
              <polyline :points="line.points" :stroke="line.stroke" class="replay-timeline__line replay-timeline__line--future" :clip-path="`url(#${clipId}-future)`" />
              <polyline :points="line.points" :stroke="line.stroke" class="replay-timeline__line" :clip-path="`url(#${clipId}-past)`" />
            </template>
          </svg>
          <div class="replay-timeline__marks">
            <button v-for="(mark, index) in marks" :key="index" type="button" class="replay-timeline__mark"
              :class="{'replay-timeline__mark--future': mark.step > current}" :style="{left: xOf(mark.step) + 'px'}"
              v-glass-tooltip="markText(mark)" :aria-label="markText(mark)" @click="$emit('go', mark.step)">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path :fill="markColor(mark.color)" :d="mark.kind === 'milestone' ? FLAG : TROPHY" /></svg>
            </button>
          </div>
          <div class="replay-timeline__track">
            <button v-for="(generation, index) in generations" :key="generation.number" type="button" class="replay-timeline__column"
              :class="{'replay-timeline__column--now': index === currentGeneration}"
              :style="{left: segments[index].left + 'px', width: segments[index].width + 'px'}"
              v-glass-tooltip="generationText(generation)" :aria-label="generationText(generation)" @click="$emit('go', generation.start)"></button>
            <span v-for="(raise, index) in raises" :key="'r' + index" class="replay-timeline__dot" :class="['replay-timeline__dot--' + raise.parameter, {'replay-timeline__dot--future': raise.step > current}]"
              :style="{left: (xOf(raise.step) + raise.index * 4) + 'px', top: laneTop(raise.parameter)}"></span>
          </div>
        </div>
      </div>
    </div>
    <div ref="scrub" class="replay-timeline__scrub" role="slider" tabindex="0" :aria-label="$t('Course of the game')"
      aria-valuemin="1" :aria-valuemax="count" :aria-valuenow="current + 1"
      @pointerdown="onPointerDown" @pointermove="onPointerMove" @pointerup="onPointerUp" @pointercancel="onPointerUp">
      <span v-for="(segment, index) in segments" :key="index" class="replay-timeline__bar" :style="{left: segment.left + 'px', width: segment.width + 'px'}">
        <i :style="{width: Math.max(0, Math.min(segment.width, currentX - segment.left)) + 'px'}"></i>
      </span>
      <span class="replay-timeline__thumb" :style="{left: thumbX + 'px'}"></span>
    </div>
    <div class="replay-timeline__fold">
      <div>
        <div class="replay-timeline__labels">
          <span v-for="label in labels" :key="label.number" :class="{'replay-timeline__label--now': label.index === currentGeneration}"
            :style="{left: label.center + 'px'}">{{ generationLabel(label.number) }}</span>
        </div>
      </div>
    </div>
    <span class="replay-timeline__playhead" :style="{left: thumbX + 'px'}" aria-hidden="true"></span>
  </div>
</template>

<script setup lang="ts">
import {computed, onBeforeUnmount, onMounted, ref} from 'vue';
import {Color} from '@/common/Color';
import {translateText, translateTextWithParams} from '@/client/directives/i18n';
import {glassTooltip as vGlassTooltip} from '@/client/directives/GlassTooltip';
import {ReplayGeneration, ReplayMark, ReplayParameter, ReplayRaise} from './replaySteps';
import {replayColor} from './replayColors';

const props = defineProps<{
  count: number,
  current: number,
  generations: ReadonlyArray<ReplayGeneration>,
  raises: ReadonlyArray<ReplayRaise>,
  marks: ReadonlyArray<ReplayMark>,
  // Victory points (TR included) of every player at every step
  victoryPoints: ReadonlyArray<{color: Color, values: ReadonlyArray<number>}>,
  playerNames: Partial<Record<Color, string>>,
  thin: boolean,
}>();
const emit = defineEmits<{(event: 'go', step: number): void, (event: 'scrubbing', active: boolean): void}>();

// Material Symbols: flag = milestone, trophy = award (like the lobby timeline)
const FLAG = 'M5 21V4h9l.4 2H20v10h-7l-.4-2H7v7z';
const TROPHY = 'M7 21v-2h4v-3.1q-1.2-.3-2.2-1.1T7.4 12.8Q5.5 12.6 4.3 11.2T3 8V7q0-.8.6-1.4T5 5h2V3h10v2h2q.8 0 1.4.6T21 7v1q0 1.8-1.3 3.2t-3.1 1.6q-.4 1-1.4 1.8T13 15.9V19h4v2zm0-10.2V7H5v1q0 .9.6 1.7T7 10.8m10 0q.8-.3 1.4-1.1T19 8V7h-2z';
const LANES: ReadonlyArray<ReplayParameter> = ['temperature', 'oxygen', 'oceans'];
const GAP = 3;
const LABEL_HALF_WIDTH = 14;
const TRACK_HEIGHT = 54;
const DOT_SIZE = 9;
const trHeight = 72;
const clipId = 'replay-tr-' + Math.random().toString(36).slice(2, 8);

const graph = ref<HTMLElement>();
const scrub = ref<HTMLElement>();
const width = ref(600);
let observer: ResizeObserver | undefined;
onMounted(() => {
  if (graph.value === undefined || typeof ResizeObserver === 'undefined') {
    return;
  }
  observer = new ResizeObserver(([entry]) => width.value = Math.max(100, entry.contentRect.width));
  observer.observe(graph.value);
});
onBeforeUnmount(() => observer?.disconnect());

// Column width = share of the steps, so slider and graph line up exactly
const segments = computed(() => {
  const available = width.value - GAP * Math.max(0, props.generations.length - 1);
  let left = 0;
  return props.generations.map((generation) => {
    const segment = {left, width: generation.count / Math.max(1, props.count) * available};
    left += segment.width + GAP;
    return segment;
  });
});
const generationIndexOf = (step: number) => Math.max(0, props.generations.findIndex((generation) => step >= generation.start && step < generation.start + generation.count));
const xOf = (step: number): number => {
  const index = generationIndexOf(step);
  const generation = props.generations[index];
  const segment = segments.value[index];
  if (generation === undefined || segment === undefined) {
    return 0;
  }
  return segment.left + (step - generation.start + 0.5) / generation.count * segment.width;
};
const currentX = computed(() => xOf(props.current));
const currentGeneration = computed(() => generationIndexOf(props.current));
// The thumb never sticks out of the bar: at the first and last step it touches the bar ends (radius as in replay.less)
const THUMB_RADIUS = {thin: 11, full: 14};
const thumbX = computed(() => {
  const radius = props.thin ? THUMB_RADIUS.thin : THUMB_RADIUS.full;
  return Math.min(Math.max(currentX.value, radius), width.value - radius);
});

// Numbers of the generations thin out where they would touch; first and last stay inside the bar
const labels = computed(() => {
  let lastRight = -Infinity;
  return props.generations.flatMap((generation, index) => {
    const segment = segments.value[index];
    const center = Math.min(Math.max(segment.left + segment.width / 2, LABEL_HALF_WIDTH), width.value - LABEL_HALF_WIDTH);
    if (center - LABEL_HALF_WIDTH < lastRight && index !== currentGeneration.value) {
      return [];
    }
    lastRight = center + LABEL_HALF_WIDTH;
    return [{number: generation.number, index, center}];
  });
});

const allRatings = computed(() => props.victoryPoints.flatMap((rating) => rating.values));
const trMin = computed(() => Math.min(...allRatings.value, 20) - 1);
const trMax = computed(() => Math.max(...allRatings.value, 21) + 1);
const trY = (value: number) => trHeight - 4 - (value - trMin.value) / (trMax.value - trMin.value) * (trHeight - 8);
const trGrid = computed(() => {
  const values = [];
  for (let value = Math.ceil(trMin.value / 10) * 10; value <= trMax.value; value += 10) {
    values.push(value);
  }
  return values;
});
const trLines = computed(() => props.victoryPoints.map((rating) => ({
  color: rating.color,
  stroke: replayColor(rating.color),
  points: rating.values.map((value, step) => `${xOf(step).toFixed(1)},${trY(value).toFixed(1)}`).join(' '),
})));

const laneHeight = TRACK_HEIGHT / LANES.length;
const laneTop = (parameter: ReplayParameter) => `${LANES.indexOf(parameter) * laneHeight + (laneHeight - DOT_SIZE) / 2}px`;
const markColor = (color: Color) => replayColor(color);
const generationLabel = (generation: number) => translateTextWithParams('G${0}', [String(generation)]);
const markText = (mark: ReplayMark) => `${translateText(mark.kind === 'milestone' ? 'Milestone' : 'Award')} ${translateText(mark.name)} · ${props.playerNames[mark.color] ?? ''}`;
function generationText(generation: ReplayGeneration): string {
  const lines = [translateTextWithParams('Generation ${0}', [String(generation.number)])];
  props.marks.filter((mark) => mark.step >= generation.start && mark.step < generation.start + generation.count).forEach((mark) => lines.push(markText(mark)));
  return lines.join('\n');
}

// Dragging on the slider: nearest step to the pointer, also in the gaps between generations
let dragging = false;
function stepAt(clientX: number): number {
  const left = scrub.value?.getBoundingClientRect().left ?? 0;
  const x = clientX - left;
  let best = 0;
  let bestDistance = Infinity;
  for (let step = 0; step < props.count; step++) {
    const distance = Math.abs(xOf(step) - x);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = step;
    }
  }
  return best;
}
function onPointerDown(event: PointerEvent): void {
  dragging = true;
  (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
  emit('scrubbing', true);
  emit('go', stepAt(event.clientX));
}
function onPointerMove(event: PointerEvent): void {
  if (dragging) {
    emit('go', stepAt(event.clientX));
  }
}
function onPointerUp(): void {
  if (dragging) {
    dragging = false;
    emit('scrubbing', false);
  }
}
</script>
