<template>
  <!-- Course of a running game: one column per generation, its width is how long the generation took, its height how
       much was terraformed in it (stacked by parameter). Above: milestones (star) and funded awards (trophy) with the
       player's colour; hatched to the right: the estimated time left. Without a course (AI training games) the plain bar. -->
  <div class="lobby-timeline">
    <div class="lobby-timeline-meta">
      <span>{{ terraformedParts[0] }}<b>{{ percent }}</b>{{ terraformedParts[1] }}<template v-if="leftText"> · {{ leftText }}</template></span>
      <span v-if="generations.length > 0" class="lobby-timeline-legend">
        <span v-for="parameter in parameters" :key="parameter"><i :class="'lobby-timeline-' + parameter"></i>{{ $t(PARAMETER_LABELS[parameter]) }}</span>
      </span>
    </div>
    <template v-if="generations.length > 0">
      <div class="lobby-timeline-marks">
        <span v-for="(mark, index) in placedMarks" :key="index" class="lobby-timeline-mark" :style="{left: mark.left + '%', marginLeft: mark.shift + 'px'}"
          v-glass-tooltip="markText(mark)">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="mark.kind === 'milestone' ? STAR : TROPHY" /></svg>
          <i :class="'player_bg_color_' + mark.color"></i>
        </span>
      </div>
      <div ref="track" class="lobby-timeline-track">
        <span v-for="generation in generations" :key="generation.number" class="lobby-timeline-column"
          :class="{'lobby-timeline-column--running': generation.number === generations.length}"
          :style="{width: 'calc(' + share(generation.durationMs) + '% - 3px)', '--step': stepHeight + 'px'}"
          v-glass-tooltip="generationText(generation)">
          <i v-for="parameter in stackedParameters(generation)" :key="parameter" :class="['lobby-timeline-' + parameter, {'lobby-timeline-joints': stepHeight >= MIN_JOINT_STEP}]"
            :style="{height: (generation.steps[parameter] ?? 0) * stepHeight + 'px'}"></i>
        </span>
        <span v-if="remaining > 0" class="lobby-timeline-rest" :style="{left: share(played) + '%'}"></span>
      </div>
      <div class="lobby-timeline-base"><i :style="{width: share(played) + '%'}"></i></div>
      <div class="lobby-timeline-labels">
        <span v-for="label in labels" :key="label.number" :class="{'lobby-timeline-labels--running': label.number === generations.length}"
          :style="{left: label.center + '%'}">{{ translateTextWithParams('G${0}', [String(label.number)]) }}</span>
      </div>
    </template>
    <div v-else class="lobby-game-progress" role="progressbar" :aria-label="$t('Terraforming')"
      aria-valuemin="0" aria-valuemax="100" :aria-valuenow="percent">
      <i :style="{width: percent + '%'}"></i>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed, onBeforeUnmount, onMounted, ref} from 'vue';
import {LobbyGameMark, LobbyGameProgress, LobbyGeneration, LobbyParameter, LOBBY_PARAMETERS} from '@/common/lobby/LobbyModel';
import {translateText, translateTextWithParams} from '@/client/directives/i18n';
import {glassTooltip as vGlassTooltip} from '@/client/directives/GlassTooltip';
import {lobbyDuration} from './lobbyDuration';

const props = defineProps<{progress: LobbyGameProgress}>();

const PARAMETER_LABELS: Record<LobbyParameter, string> = {temperature: 'Temperature', oxygen: 'Oxygen', oceans: 'Oceans', venus: 'Venus'};
// Change per step as the players read it on the board
const PARAMETER_UNITS: Record<LobbyParameter, (steps: number) => string> = {
  temperature: (steps) => `+${steps * 2} °C`,
  oxygen: (steps) => `+${steps} %`,
  oceans: (steps) => `+${steps}`,
  venus: (steps) => `+${steps * 2} %`,
};
const STAR = 'M12 2.5l2.9 6.2 6.6.7-5 4.5 1.4 6.6L12 17.2 6.1 20.5l1.4-6.6-5-4.5 6.6-.7z';
const TROPHY = 'M7 3h10v2h3v3a4 4 0 0 1-4 4h-.4A5 5 0 0 1 13 14.9V17h3v3H8v-3h3v-2.1A5 5 0 0 1 8.4 12H8a4 4 0 0 1-4-4V5h3zm-1 4v1a2 2 0 0 0 1.3 1.9A6 6 0 0 1 7 8V7zm11 0v1c0 .6-.1 1.3-.3 1.9A2 2 0 0 0 18 8V7z';
// Inner height of a column (contract with lobby.less: .lobby-timeline-track height minus the column padding)
const COLUMN_HEIGHT = 37;
// Below this a column would hardly differ from its neighbours: the scale never gets coarser than six steps
const MIN_SCALE_STEPS = 6;
// Joints between single steps only while a step is at least this high, below the block stays one colour
const MIN_JOINT_STEP = 3;
// Labels need about this much room (px) so that neighbours never touch
const LABEL_WIDTH = 26;
// Marks closer than this (px, about one symbol) move apart
const MARK_GAP = 16;

const generations = computed(() => props.progress.generations ?? []);
const percent = computed(() => Math.round(props.progress.terraforming * 100));
const played = computed(() => generations.value.reduce((sum, generation) => sum + generation.durationMs, 0));
const remaining = computed(() => props.progress.remainingMs ?? 0);
const axis = computed(() => Math.max(1, played.value + remaining.value));
const share = (milliseconds: number) => milliseconds / axis.value * 100;

// "51 % terraformed": the number in bold, the words around it from the translation
const terraformedParts = computed(() => translateTextWithParams('${0} % terraformed', ['\u0000']).split('\u0000'));
const leftText = computed(() => remaining.value > 0 ? translateTextWithParams('about ${0} left', [lobbyDuration(remaining.value)]) : '');

const total = (generation: LobbyGeneration) => LOBBY_PARAMETERS.reduce((sum, parameter) => sum + (generation.steps[parameter] ?? 0), 0);
// Scale of all columns: the strongest generation of the game, so the columns stay comparable
const stepHeight = computed(() => COLUMN_HEIGHT / Math.max(MIN_SCALE_STEPS, ...generations.value.map(total)));
const parameters = computed(() => LOBBY_PARAMETERS.filter((parameter) => parameter !== 'venus' || generations.value.some((generation) => generation.steps.venus !== undefined)));
const stackedParameters = (generation: LobbyGeneration) => LOBBY_PARAMETERS.filter((parameter) => (generation.steps[parameter] ?? 0) > 0);

function generationText(generation: LobbyGeneration): string {
  const running = generation.number === generations.value.length;
  const head = `${translateTextWithParams('Generation ${0}', [String(generation.number)])} · ${lobbyDuration(generation.durationMs)}${running ? ' · ' + translateText('Running') : ''}`;
  const steps = stackedParameters(generation).map((parameter) => `${translateText(PARAMETER_LABELS[parameter])} ${PARAMETER_UNITS[parameter](generation.steps[parameter] ?? 0)}`);
  const marks = (props.progress.marks ?? []).filter((mark) => mark.generation === generation.number).map(markText);
  return [head, ...(steps.length > 0 ? steps : [translateText('No parameter raised')]), ...marks].join('\n');
}

function markText(mark: LobbyGameMark): string {
  return `${translateText(mark.kind === 'milestone' ? 'Milestone' : 'Award')} ${translateText(mark.name)} · ${mark.player}`;
}

// Width of the track in px: marks and generation numbers must not overlap
const track = ref<HTMLElement>();
const trackWidth = ref(0);
let observer: ResizeObserver | undefined;
onMounted(() => {
  if (track.value === undefined || typeof ResizeObserver === 'undefined') {
    return;
  }
  observer = new ResizeObserver(([entry]) => trackWidth.value = entry.contentRect.width);
  observer.observe(track.value);
});
onBeforeUnmount(() => observer?.disconnect());

// Marks that would overlap move to the right until they stand next to each other
const placedMarks = computed(() => {
  let previousRight = -Infinity;
  return (props.progress.marks ?? []).map((mark) => {
    const left = share(mark.atMs);
    const position = left / 100 * trackWidth.value;
    const shift = Math.max(0, previousRight - position);
    previousRight = position + shift + MARK_GAP;
    return {...mark, left, shift};
  });
});

// Generation numbers only where there is room; the running one always, nothing overlaps
const labels = computed(() => {
  let start = 0;
  const centers = generations.value.map((generation) => {
    const center = share(start + generation.durationMs / 2);
    start += generation.durationMs;
    return {number: generation.number, center};
  });
  const pixels = (center: number) => center / 100 * trackWidth.value;
  const running = centers[centers.length - 1];
  let lastRight = -Infinity;
  return centers.filter((label) => {
    if (label === running) {
      return true;
    }
    const position = pixels(label.center);
    if (position - LABEL_WIDTH / 2 < lastRight || position + LABEL_WIDTH > pixels(running.center)) {
      return false;
    }
    lastRight = position + LABEL_WIDTH / 2;
    return true;
  });
});
</script>
