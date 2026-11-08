<template>
  <!-- Course of a running game: one column per generation, its width is how long the generation took, but never
       less than it needs for its number and its dots (lobbyTimelineLayout.ts). Every raised
       step of a global parameter is one dot in the parameter's colour, the dots fill the column from below; claimed
       milestones (flag) and funded awards (trophy) sit on top of the dots in the player's colour. The estimated time
       left is hatched, the bar goes on dashed there and says how long. Without a course (AI training games) the plain bar. -->
  <div class="lobby-timeline">
    <div class="lobby-timeline-meta">
      <span>{{ terraformedParts[0] }}<b>{{ percent }}</b>{{ terraformedParts[1] }}</span>
      <span v-if="generations.length > 0" class="lobby-timeline-legend">
        <span class="lobby-timeline-legend-group">
          <span v-for="parameter in parameters" :key="parameter"><i :class="'lobby-timeline-' + parameter"></i>{{ parameterLabel(parameter) }}</span>
        </span>
        <span class="lobby-timeline-legend-group">
          <span><svg viewBox="0 0 24 24" aria-hidden="true"><path :d="FLAG" /></svg>{{ $t('Milestone') }}</span>
          <span><svg viewBox="0 0 24 24" aria-hidden="true"><path :d="TROPHY" /></svg>{{ $t('Award') }}</span>
        </span>
      </span>
    </div>
    <template v-if="generations.length > 0">
      <div ref="track" class="lobby-timeline-track">
        <span v-for="(generation, index) in generations" :key="generation.number" class="lobby-timeline-column"
          :style="place(segments[index])" v-glass-tooltip="generationText(generation)">
          <span v-if="marksIn(generation).length > 0" class="lobby-timeline-marks">
            <svg v-for="(mark, markIndex) in marksIn(generation)" :key="markIndex" viewBox="0 0 24 24" :class="'lobby-timeline-mark--' + mark.color"
              aria-hidden="true"><path :d="mark.kind === 'milestone' ? FLAG : TROPHY" /></svg>
          </span>
          <span class="lobby-timeline-dots">
            <i v-for="(parameter, dotIndex) in stepList(generation)" :key="dotIndex" :class="'lobby-timeline-' + parameter"></i>
          </span>
        </span>
        <span v-if="restSegment" class="lobby-timeline-rest" :style="place(restSegment)"></span>
      </div>
      <div class="lobby-timeline-base">
        <i v-for="(generation, index) in generations" :key="generation.number" :class="{'lobby-timeline-base--running': generation.number === generations.length}"
          :style="place(segments[index])"></i>
        <i v-if="restSegment" class="lobby-timeline-base--rest" :style="place(restSegment)"></i>
      </div>
      <div class="lobby-timeline-labels">
        <span v-for="label in labels" :key="label.number" :class="{'lobby-timeline-labels--running': label.number === generations.length}"
          :style="{left: percentOf(label.center)}">{{ translateTextWithParams('G${0}', [String(label.number)]) }}</span>
        <span v-if="restLabelFits" class="lobby-timeline-labels--rest" :style="{left: percentOf(restSegment!.left + restSegment!.width / 2)}">{{ leftText }}</span>
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
import {layoutTimeline, TimelineSegment} from './lobbyTimelineLayout';

const props = defineProps<{progress: LobbyGameProgress}>();

const PARAMETER_NAMES: Record<LobbyParameter, string> = {temperature: 'Temperature', oxygen: 'Oxygen', oceans: 'Oceans', venus: 'Venus'};
// Short labels of the legend as printed on the board: °C and O₂ need no translation
const BOARD_SYMBOLS: Partial<Record<LobbyParameter, string>> = {temperature: '°C', oxygen: 'O₂'};
// Change per step as the players read it on the board
const PARAMETER_UNITS: Record<LobbyParameter, (steps: number) => string> = {
  temperature: (steps) => `+${steps * 2} °C`,
  oxygen: (steps) => `+${steps} %`,
  oceans: (steps) => `+${steps}`,
  venus: (steps) => `+${steps * 2} %`,
};
// Material Symbols: flag = milestone, trophy = award
const FLAG = 'M5 21V4h9l.4 2H20v10h-7l-.4-2H7v7z';
const TROPHY = 'M7 21v-2h4v-3.1q-1.2-.3-2.2-1.1T7.4 12.8Q5.5 12.6 4.3 11.2T3 8V7q0-.8.6-1.4T5 5h2V3h10v2h2q.8 0 1.4.6T21 7v1q0 1.8-1.3 3.2t-3.1 1.6q-.4 1-1.4 1.8T13 15.9V19h4v2zm0-10.2V7H5v1q0 .9.6 1.7T7 10.8m10 0q.8-.3 1.4-1.1T19 8V7h-2z';
// Generation numbers need about this much room (px) so that neighbours never touch; every generation is at least
// this wide, so its number always shows
const LABEL_WIDTH = 26;
// Geometry of a column, mirrors lobby.less (.lobby-timeline-track/-column/-dots/-marks): the minimum width of a
// generation also leaves room for all its dots, so they never spill out of the column
const TRACK_HEIGHT = 40;
const COLUMN_PADDING_SIDE = 2;
const COLUMN_PADDING_BOTTOM = 3;
const COLUMN_GAP = 3;
const MARK_SIZE = 14;
const MARK_OVERLAP = 5;
const DOT_PITCH = 6; // dot 4px + gap 2px
// Narrowest column that still reads as a generation
const MINIMUM_COLUMN = 8;
// Estimated rest: room for "about 1 h 20 min left" at 11px
const REST_CHARACTER_WIDTH = 6;
// Layout width before the track has been measured (first paint, tests)
const FALLBACK_WIDTH = 600;

const generations = computed(() => props.progress.generations ?? []);
const percent = computed(() => Math.round(props.progress.terraforming * 100));
const remaining = computed(() => props.progress.remainingMs ?? 0);

// "51 % terraformed": the number in bold, the words around it from the translation
const terraformedParts = computed(() => translateTextWithParams('${0} % terraformed', ['\u0000']).split('\u0000'));
const leftText = computed(() => remaining.value > 0 ? translateTextWithParams('about ${0} left', [lobbyDuration(remaining.value)]) : '');

const parameters = computed(() => LOBBY_PARAMETERS.filter((parameter) => parameter !== 'venus' || generations.value.some((generation) => generation.steps.venus !== undefined)));
const parameterLabel = (parameter: LobbyParameter) => BOARD_SYMBOLS[parameter] ?? translateText(PARAMETER_NAMES[parameter]);
const raisedParameters = (generation: LobbyGeneration) => LOBBY_PARAMETERS.filter((parameter) => (generation.steps[parameter] ?? 0) > 0);
// One dot per step, grouped by parameter in a fixed order
const stepList = (generation: LobbyGeneration) => raisedParameters(generation).flatMap((parameter) => Array<LobbyParameter>(generation.steps[parameter] ?? 0).fill(parameter));
const marksIn = (generation: LobbyGeneration) => (props.progress.marks ?? []).filter((mark) => mark.generation === generation.number);

function generationText(generation: LobbyGeneration): string {
  const running = generation.number === generations.value.length;
  const head = `${translateTextWithParams('Generation ${0}', [String(generation.number)])} · ${lobbyDuration(generation.durationMs)}${running ? ' · ' + translateText('Running') : ''}`;
  const steps = raisedParameters(generation).map((parameter) => `${translateText(PARAMETER_NAMES[parameter])} ${PARAMETER_UNITS[parameter](generation.steps[parameter] ?? 0)}`);
  return [head, ...(steps.length > 0 ? steps : [translateText('No parameter raised')]), ...marksIn(generation).map(markText)].join('\n');
}

function markText(mark: LobbyGameMark): string {
  return `${translateText(mark.kind === 'milestone' ? 'Milestone' : 'Award')} ${translateText(mark.name)} · ${mark.player}`;
}

// Width of the track in px: generation numbers must not overlap
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

const layoutWidth = computed(() => trackWidth.value > 0 ? trackWidth.value : FALLBACK_WIDTH);
// Room for all dots and marks (+1px against sub-pixel rounding that would wrap one dot into an extra row)
function contentWidth(generation: LobbyGeneration): number {
  const markRoom = marksIn(generation).length > 0 ? MARK_SIZE + COLUMN_GAP : 0;
  const rows = Math.max(1, Math.floor((TRACK_HEIGHT - COLUMN_PADDING_BOTTOM - markRoom + DOT_PITCH - 4) / DOT_PITCH));
  const columns = Math.ceil(stepList(generation).length / rows);
  const markCount = marksIn(generation).length;
  // Marks overlap by MARK_OVERLAP like stacked cubes (lobby.less .lobby-timeline-marks)
  const marks = markCount > 0 ? MARK_SIZE + (markCount - 1) * (MARK_SIZE - MARK_OVERLAP) : 0;
  const dots = columns * DOT_PITCH - (DOT_PITCH - 4);
  return Math.max(MINIMUM_COLUMN, Math.max(dots, marks) + 2 * COLUMN_PADDING_SIDE + 1);
}
const restTextWidth = computed(() => leftText.value.length * REST_CHARACTER_WIDTH);
// Pixel layout of all generations and the rest: same numbers for columns, bar and labels
const layout = computed(() => {
  const weights = generations.value.map((generation) => generation.durationMs);
  // First choice: room for number and dots. If that does not fit (many generations on a phone): room for the dots
  // only, the numbers thin out; dots and marks never spill out of their column
  const fallbackMinimums = generations.value.map(contentWidth);
  const minimums = fallbackMinimums.map((width) => Math.max(LABEL_WIDTH, width));
  if (remaining.value > 0) {
    weights.push(remaining.value);
    minimums.push(restTextWidth.value);
    fallbackMinimums.push(MINIMUM_COLUMN);
  }
  return layoutTimeline(weights, minimums, layoutWidth.value, fallbackMinimums);
});
const segments = computed(() => layout.value.slice(0, generations.value.length));
const restSegment = computed(() => remaining.value > 0 ? layout.value[generations.value.length] : undefined);
// Squeezed below its text (very many generations on a phone): the dashed bar alone says there is time left
const restLabelFits = computed(() => restSegment.value !== undefined && restSegment.value.width >= restTextWidth.value - 0.5);
// Percent of the track, so a resize looks right even before the observer has measured again
const percentOf = (pixels: number) => `${pixels / layoutWidth.value * 100}%`;
const place = (segment: TimelineSegment) => ({left: percentOf(segment.left), width: percentOf(segment.width)});

// Generation numbers: every generation is wide enough for its number. Only when not even the minimums fit (very
// many generations on a phone) numbers are left out, the running one always stays.
const labels = computed(() => {
  // Kept inside the track: the first and last number never stick out at the edges
  const clamp = (center: number) => Math.min(Math.max(center, LABEL_WIDTH / 2), layoutWidth.value - LABEL_WIDTH / 2);
  const centers = segments.value.map((segment, index) => ({number: generations.value[index].number, center: clamp(segment.left + segment.width / 2)}));
  const running = centers[centers.length - 1];
  let lastRight = -Infinity;
  return centers.filter((label) => {
    if (label === running) {
      return true;
    }
    if (label.center - LABEL_WIDTH / 2 < lastRight || label.center + LABEL_WIDTH > running.center) {
      return false;
    }
    lastRight = label.center + LABEL_WIDTH / 2;
    return true;
  });
});
</script>
