<template>
  <!-- Floating replay control on frosted glass. Folded it is a narrow bar (play, slider, position) that can be dragged
       anywhere; a click unfolds it, Escape or the size toggle folds it again (replayPanelMotion.ts). -->
  <section ref="panel" class="replay-panel" data-scrollbar-obstacle
    :class="{'replay-panel--thin': motion.thin.value, 'replay-panel--narrow': motion.narrow.value, 'replay-panel--dragging': motion.dragging.value}"
    :style="{'--replay-panel-x': motion.offset.value.x + 'px', '--replay-panel-y': motion.offset.value.y + 'px'}"
    :aria-label="$t('Replay')"
    @pointerdown="motion.onPointerDown" @pointermove="motion.onPointerMove" @pointerup="motion.onPointerUp" @pointercancel="motion.onPointerCancel">
    <div class="replay-panel__fold replay-panel__fold--top">
      <div>
        <header class="replay-panel__head">
          <div class="replay-panel__title">
            <b>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4a8 8 0 1 1-7.4 5H2.5l3.1-3.6L8.8 9H6.7A6 6 0 1 0 12 6zm-1.5 4.5 5 3.5-5 3.5z" /></svg>
              <span v-i18n>Replay</span>
            </b>
            <span v-i18n>View only</span>
          </div>
          <div class="replay-panel__head-right">
            <span class="replay-panel__view-label" v-i18n>View of</span>
            <div class="replay-panel__segments" role="group" :aria-label="$t('View of')">
              <button v-for="player in players" :key="player.color" type="button" :aria-pressed="player.color === perspective"
                :title="player.name" @click="$emit('perspective', player.color)">
                <span class="replay-panel__cube" :class="'player_bg_color_' + player.color"></span>
                <span class="replay-panel__name">{{ player.name }}</span>
              </button>
            </div>
            <button type="button" class="replay-panel__icon-button replay-panel__size-toggle" :aria-label="sizeToggleLabel" :title="sizeToggleLabel" @click="motion.toggle">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="SHRINK_ICON" /></svg>
              <span v-i18n>Minimize</span>
              <HotkeyKeys :fixed="['Escape']" />
            </button>
            <button type="button" class="replay-panel__icon-button" :aria-label="$t('Close replay')" :title="$t('Close replay')" @click="$emit('close')">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.4 19 5 17.6l5.6-5.6L5 6.4 6.4 5l5.6 5.6L17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6z" /></svg>
            </button>
          </div>
        </header>
        <div class="replay-panel__info">
          <div class="replay-panel__now">
            <div class="replay-panel__position"><b>{{ generationText }}</b></div>
            <div class="replay-panel__event">
              <span v-if="actor !== undefined" class="replay-panel__cube" :class="'player_bg_color_' + actor"></span>
              <span>{{ eventText }}</span>
            </div>
          </div>
          <div class="replay-panel__state">
            <span v-for="rating in currentPoints" :key="rating.color"><span class="replay-panel__cube" :class="'player_bg_color_' + rating.color"></span><b>{{ rating.value }}</b></span>
            <span class="replay-panel__divider" aria-hidden="true"></span>
            <span><i class="replay-panel__swatch replay-panel__swatch--temperature"></i><b>{{ temperatureText }}</b></span>
            <span><i class="replay-panel__swatch replay-panel__swatch--oxygen"></i><b>{{ oxygen }} %</b> O₂</span>
            <span><i class="replay-panel__swatch replay-panel__swatch--oceans"></i><b>{{ oceans }}/9</b></span>
          </div>
        </div>
      </div>
    </div>

    <div class="replay-panel__graph" :title="$t('Click a flag, a trophy or a generation to jump there')">
      <ReplayTimeline :count="count" :current="current" :generations="generations" :raises="raises" :marks="marks"
        :victoryPoints="victoryPoints" :playerNames="playerNames" :thin="motion.thin.value"
        @go="go" @scrubbing="onScrubbing" />
    </div>
    <!-- Thin bar: play on the left, position and size toggle on the right. Anchored to the panel edges, not to the
         slider: while the panel unfolds they only fade, instead of travelling sideways with the slider margins. -->
    <div class="replay-panel__thin-left">
      <!-- Grips at both ends: the thin bar can be dragged anywhere -->
      <svg class="replay-panel__grip" viewBox="0 0 8 16" aria-hidden="true"><circle v-for="dot in GRIP_DOTS" :key="dot.x + '-' + dot.y" :cx="dot.x" :cy="dot.y" r="1.3" /></svg>
      <ReplayPlayButton :playing="playing" :label="playLabel" :size="34" :radius="8" :stepMs="stepMs" :runKey="current" @toggle="togglePlay" />
    </div>
    <div class="replay-panel__thin-right">
      <span class="replay-panel__thin-speed">
        <ReplaySpeedBars v-model="speed" small />
        <b>{{ secondsText }}</b>
      </span>
      <span class="replay-panel__thin-text"><b>{{ shortGeneration }}</b> · {{ current + 1 }}/{{ count }}</span>
      <button type="button" class="replay-panel__icon-button replay-panel__size-toggle replay-panel__size-toggle--small" :aria-label="sizeToggleLabel" :title="sizeToggleLabel" @click="motion.toggle">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="EXPAND_ICON" /></svg>
      </button>
      <svg class="replay-panel__grip" viewBox="0 0 8 16" aria-hidden="true"><circle v-for="dot in GRIP_DOTS" :key="dot.x + '-' + dot.y" :cx="dot.x" :cy="dot.y" r="1.3" /></svg>
    </div>

    <div class="replay-panel__fold">
      <div>
        <!-- Two boxes: the controls, and the speed with the position. Every control is a square with its key inside. -->
        <footer class="replay-panel__foot">
          <div class="replay-panel__box replay-panel__transport">
            <button type="button" class="replay-panel__key-button" :aria-label="$t('Previous generation')" :title="$t('Previous generation')" @click="generationStep(-1)">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 18V6h2v12zm3.5-6L18 6v12z" /></svg>
              <HotkeyKeys :fixed="['⇧', 'ArrowLeft']" />
            </button>
            <button type="button" class="replay-panel__key-button" :aria-label="$t('Step back')" :title="$t('Step back')" @click="step(-1)">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 18-6-6 6-6 1.4 1.4-4.6 4.6 4.6 4.6z" /></svg>
              <HotkeyKeys :fixed="['ArrowLeft']" />
            </button>
            <ReplayPlayButton class="replay-panel__key-button" :playing="playing" :label="playLabel" :size="48" :radius="10" :stepMs="stepMs" :runKey="current" @toggle="togglePlay">
              <HotkeyKeys :fixed="['Space']" />
            </ReplayPlayButton>
            <button type="button" class="replay-panel__key-button" :aria-label="$t('Step forward')" :title="$t('Step forward')" @click="step(1)">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.6 12 8 7.4 9.4 6l6 6-6 6L8 16.6z" /></svg>
              <HotkeyKeys :fixed="['ArrowRight']" />
            </button>
            <button type="button" class="replay-panel__key-button" :aria-label="$t('Next generation')" :title="$t('Next generation')" @click="generationStep(1)">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 18V6h2v12zM6 18V6l8.5 6z" /></svg>
              <HotkeyKeys :fixed="['⇧', 'ArrowRight']" />
            </button>
          </div>
          <div class="replay-panel__box replay-panel__speed">
            <ReplaySpeedBars v-model="speed" />
            <div class="replay-panel__speed-text">
              <span><b>{{ secondsPerStepText }}</b> <HotkeyKeys :fixed="['-', '+']" /></span>
              <span>{{ stepText }} · {{ remainingText }}</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import {computed, onBeforeUnmount, onMounted, ref, watch} from 'vue';
import {Color} from '@/common/Color';
import {translateText, translateTextWithParams} from '@/client/directives/i18n';
import HotkeyKeys from '@/client/components/hotkeys/HotkeyKeys.vue';
import ReplayTimeline from './ReplayTimeline.vue';
import ReplayPlayButton from './ReplayPlayButton.vue';
import ReplaySpeedBars from './ReplaySpeedBars.vue';
import {REPLAY_DEFAULT_SPEED, REPLAY_STEP_MS, replayRemaining, replaySeconds} from './replaySpeed';
import {ReplayGeneration, ReplayMark, ReplayRaise} from './replaySteps';
import {useReplayPanelMotion} from './replayPanelMotion';

const props = defineProps<{
  count: number,
  current: number,
  generations: ReadonlyArray<ReplayGeneration>,
  raises: ReadonlyArray<ReplayRaise>,
  marks: ReadonlyArray<ReplayMark>,
  victoryPoints: ReadonlyArray<{color: Color, values: ReadonlyArray<number>}>,
  players: ReadonlyArray<{color: Color, name: string}>,
  perspective: Color,
  eventText: string,
  actor: Color | undefined,
  temperature: number,
  oxygen: number,
  oceans: number,
}>();
const emit = defineEmits<{(event: 'go', step: number): void, (event: 'perspective', color: Color): void, (event: 'close'): void}>();

// Size toggle: arrows pointing inwards (make smaller) and outwards (make full)
const SHRINK_ICON = 'M22 3.41 16.71 8.7H20v2h-6.7V4h2v3.29L20.59 2zM3.41 22l5.29-5.29V20h2v-6.7H4v2h3.29L2 20.59z';
// Drag grip: two columns of three dots
const GRIP_DOTS = [2, 6].flatMap((x) => [3, 8, 13].map((y) => ({x, y})));
const EXPAND_ICON = 'M21 11V3h-8l3.29 3.29-10 10L3 13v8h8l-3.29-3.29 10-10z';

const panel = ref<HTMLElement>();
// Open, the replay shows its whole panel for a moment, so one sees everything it offers, then folds to the thin bar
const INTRO_MS = 1000;
const motion = useReplayPanelMotion(panel, true);
let introTimer: number | undefined;
const endIntro = () => window.clearTimeout(introTimer);
const playing = ref(false);
// Index in REPLAY_STEP_MS
const speed = ref(REPLAY_DEFAULT_SPEED);
const stepMs = computed(() => REPLAY_STEP_MS[speed.value]);
let timer: number | undefined;

const playerNames = computed(() => Object.fromEntries(props.players.map((player) => [player.color, player.name])) as Partial<Record<Color, string>>);
const currentGeneration = computed(() => props.generations.find((generation) => props.current >= generation.start && props.current < generation.start + generation.count));
const generationText = computed(() => translateTextWithParams('Generation ${0}', [String(currentGeneration.value?.number ?? 1)]));
const shortGeneration = computed(() => translateTextWithParams('G${0}', [String(currentGeneration.value?.number ?? 1)]));
const stepText = computed(() => translateTextWithParams('Step ${0} of ${1}', [String(props.current + 1), String(props.count)]));
const currentPoints = computed(() => props.victoryPoints.map((rating) => ({color: rating.color, value: rating.values[props.current]})));
const temperatureText = computed(() => `${props.temperature > 0 ? '+' : props.temperature < 0 ? '−' : ''}${Math.abs(props.temperature)} °C`);
const playLabel = computed(() => translateText(playing.value ? 'Pause playback' : 'Start playback'));
const sizeToggleLabel = computed(() => translateText(motion.thin.value ? 'Show full' : 'Minimize'));
const secondsText = computed(() => translateTextWithParams('${0} s', [replaySeconds(stepMs.value)]));
const secondsPerStepText = computed(() => translateTextWithParams('${0} s per step', [replaySeconds(stepMs.value)]));
const remainingText = computed(() => translateTextWithParams('${0} remaining', [replayRemaining(props.count - 1 - props.current, stepMs.value)]));

const go = (step: number) => emit('go', Math.max(0, Math.min(props.count - 1, step)));
function stop(): void {
  window.clearInterval(timer);
  timer = undefined;
  playing.value = false;
}
function play(): void {
  if (props.current >= props.count - 1) {
    go(0);
  }
  playing.value = true;
  timer = window.setInterval(() => {
    if (props.current >= props.count - 1) {
      stop();
    } else {
      go(props.current + 1);
    }
  }, stepMs.value);
}
const togglePlay = () => playing.value ? stop() : play();
function step(direction: number): void {
  stop();
  go(props.current + direction);
}
function generationStep(direction: number): void {
  stop();
  const index = props.generations.findIndex((generation) => generation === currentGeneration.value);
  const generation = props.generations[index];
  if (generation === undefined) {
    return;
  }
  if (direction < 0) {
    go(props.current > generation.start ? generation.start : props.generations[Math.max(0, index - 1)].start);
  } else {
    go(index < props.generations.length - 1 ? props.generations[index + 1].start : props.count - 1);
  }
}
// A new speed applies from the next step on
watch(speed, () => {
  if (playing.value) {
    stop();
    play();
  }
});
const changeSpeed = (direction: number) => speed.value = Math.max(0, Math.min(REPLAY_STEP_MS.length - 1, speed.value + direction));
function onScrubbing(active: boolean): void {
  if (active) {
    stop();
  }
}

function onKeyDown(event: KeyboardEvent): void {
  // An open dialog over the replay (enlarged Mars, card zoom) handles its own keys, Escape closes it first. The
  // replay's own turn sheet (mobile) is no such dialog: it only shows the next action
  if (document.querySelector('.board-zoom-backdrop, [role="dialog"][aria-modal="true"]:not(.mb-sheet)') !== null) {
    return;
  }
  if (event.key === 'Escape') {
    // Escape folds the panel; closing the replay is the × button only
    if (motion.thin.value) {
      return;
    }
    event.preventDefault();
    motion.collapse();
  } else if (event.key === ' ') {
    event.preventDefault();
    togglePlay();
  } else if (event.key === '+' || event.key === '-') {
    event.preventDefault();
    changeSpeed(event.key === '+' ? 1 : -1);
  } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    const direction = event.key === 'ArrowLeft' ? -1 : 1;
    if (event.shiftKey) {
      generationStep(direction);
    } else {
      step(direction);
    }
  } else if ((event.key === 'Enter' || /^[0-9]$/.test(event.key)) && !(event.target as Element | null)?.closest('input, textarea, [contenteditable]')) {
    // Read only: the game's shortcuts that confirm or choose (Enter, numbers) do nothing; letters still switch tabs
    event.preventDefault();
  } else {
    return;
  }
  // The results page and the game's own shortcuts don't see these keys while the replay is open
  event.stopImmediatePropagation();
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown, true);
  introTimer = window.setTimeout(() => motion.collapse(), INTRO_MS);
  // Touched during the intro: the panel stays as the reader left it
  panel.value?.addEventListener('pointerdown', endIntro, {once: true});
});
onBeforeUnmount(() => {
  endIntro();
  stop();
  window.removeEventListener('keydown', onKeyDown, true);
});
defineExpose({togglePlay, step, generationStep, expand: motion.expand, collapse: motion.collapse});
</script>
