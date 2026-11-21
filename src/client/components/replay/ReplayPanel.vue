<template>
  <!-- Floating replay control on frosted glass. Without the mouse nearby it folds into a thin bar (slider, play,
       position) and becomes more transparent; coming closer unfolds it again. The size toggle keeps it thin. -->
  <section ref="panel" class="replay-panel" :class="{'replay-panel--thin': thin, 'replay-panel--away': away, 'replay-panel--prefers-thin': prefersThin}"
    :aria-label="$t('Replay')">
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
            <button type="button" class="replay-panel__icon-button replay-panel__size-toggle" :aria-label="sizeToggleLabel" :title="sizeToggleLabel" @click="toggleSize">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.4 8.6 12 13.2l4.6-4.6L18 10l-6 6-6-6z" /></svg>
            </button>
            <button type="button" class="replay-panel__icon-button" :aria-label="$t('Close replay')" :title="$t('Close replay')" @click="$emit('close')">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.4 19 5 17.6l5.6-5.6L5 6.4 6.4 5l5.6 5.6L17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6z" /></svg>
              <HotkeyKeys :fixed="['Escape']" />
            </button>
          </div>
        </header>
        <div class="replay-panel__info">
          <div class="replay-panel__now">
            <div class="replay-panel__position"><b>{{ generationText }}</b> <span>· {{ stepText }}</span></div>
            <div class="replay-panel__event">
              <span v-if="actor !== undefined" class="replay-panel__cube" :class="'player_bg_color_' + actor"></span>
              <span>{{ eventText }}</span>
            </div>
          </div>
          <div class="replay-panel__state">
            <span v-for="rating in currentRatings" :key="rating.color"><span class="replay-panel__cube" :class="'player_bg_color_' + rating.color"></span><b>{{ rating.value }}</b></span>
            <span class="replay-panel__divider" aria-hidden="true"></span>
            <span><i class="replay-panel__swatch replay-panel__swatch--temperature"></i><b>{{ temperatureText }}</b></span>
            <span><i class="replay-panel__swatch replay-panel__swatch--oxygen"></i><b>{{ oxygen }} %</b> O₂</span>
            <span><i class="replay-panel__swatch replay-panel__swatch--oceans"></i><b>{{ oceans }}/9</b></span>
          </div>
        </div>
      </div>
    </div>

    <div class="replay-panel__graph">
      <ReplayTimeline :count="count" :current="current" :generations="generations" :raises="raises" :marks="marks"
        :terraformRatings="terraformRatings" :playerNames="playerNames" :thin="thin"
        @go="go" @scrubbing="onScrubbing" />
      <div class="replay-panel__thin-left">
        <button type="button" class="replay-panel__mini-play" :aria-label="playLabel" @click="togglePlay">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="playing ? PAUSE_ICON : PLAY_ICON" /></svg>
        </button>
      </div>
      <div class="replay-panel__thin-right">
        <span class="replay-panel__thin-text"><b>{{ shortGeneration }}</b> · {{ current + 1 }}/{{ count }}</span>
        <button type="button" class="replay-panel__icon-button replay-panel__size-toggle replay-panel__size-toggle--small" :aria-label="sizeToggleLabel" :title="sizeToggleLabel" @click="toggleSize">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.4 8.6 12 13.2l4.6-4.6L18 10l-6 6-6-6z" /></svg>
        </button>
      </div>
    </div>

    <div class="replay-panel__fold">
      <div>
        <footer class="replay-panel__foot">
          <span class="replay-panel__hint" v-i18n>Click a flag, a trophy or a generation to jump there</span>
          <div class="replay-panel__transport">
            <div class="replay-panel__segments replay-panel__speed" role="group" :aria-label="$t('Speed')">
              <button v-for="option in SPEEDS" :key="option" type="button" :aria-pressed="option === speed" @click="setSpeed(option)">{{ option }}×</button>
            </div>
            <button type="button" class="replay-panel__icon-button replay-panel__step" :aria-label="$t('Previous generation')" :title="$t('Previous generation')" @click="generationStep(-1)">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 18V6h2v12zm3.5-6L18 6v12z" /></svg>
              <HotkeyKeys :fixed="['⇧', 'ArrowLeft']" />
            </button>
            <button type="button" class="replay-panel__icon-button replay-panel__step" :aria-label="$t('Step back')" :title="$t('Step back')" @click="step(-1)">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 18-6-6 6-6 1.4 1.4-4.6 4.6 4.6 4.6z" /></svg>
              <HotkeyKeys :fixed="['ArrowLeft']" />
            </button>
            <button type="button" class="btn btn-primary btn-rounded replay-panel__play" @click="togglePlay">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="playing ? PAUSE_ICON : PLAY_ICON" /></svg>
              <span>{{ playLabel }}</span>
              <HotkeyKeys :fixed="['Space']" />
            </button>
            <button type="button" class="replay-panel__icon-button replay-panel__step" :aria-label="$t('Step forward')" :title="$t('Step forward')" @click="step(1)">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.6 12 8 7.4 9.4 6l6 6-6 6L8 16.6z" /></svg>
              <HotkeyKeys :fixed="['ArrowRight']" />
            </button>
            <button type="button" class="replay-panel__icon-button replay-panel__step" :aria-label="$t('Next generation')" :title="$t('Next generation')" @click="generationStep(1)">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 18V6h2v12zM6 18V6l8.5 6z" /></svg>
              <HotkeyKeys :fixed="['⇧', 'ArrowRight']" />
            </button>
          </div>
        </footer>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import {computed, onBeforeUnmount, onMounted, ref} from 'vue';
import {Color} from '@/common/Color';
import {translateText, translateTextWithParams} from '@/client/directives/i18n';
import HotkeyKeys from '@/client/components/hotkeys/HotkeyKeys.vue';
import ReplayTimeline from './ReplayTimeline.vue';
import {ReplayGeneration, ReplayMark, ReplayRaise} from './replaySteps';

const props = defineProps<{
  count: number,
  current: number,
  generations: ReadonlyArray<ReplayGeneration>,
  raises: ReadonlyArray<ReplayRaise>,
  marks: ReadonlyArray<ReplayMark>,
  terraformRatings: ReadonlyArray<{color: Color, values: ReadonlyArray<number>}>,
  players: ReadonlyArray<{color: Color, name: string}>,
  perspective: Color,
  eventText: string,
  actor: Color | undefined,
  temperature: number,
  oxygen: number,
  oceans: number,
}>();
const emit = defineEmits<{(event: 'go', step: number): void, (event: 'perspective', color: Color): void, (event: 'close'): void}>();

const PLAY_ICON = 'M8 5v14l11-7z';
const PAUSE_ICON = 'M6 19h4V5H6zm8-14v14h4V5z';
const SPEEDS = [1, 2, 4] as const;
const STEP_MS = 700;
// Coming closer than this unfolds the panel, moving further away than the smaller distance folds it again (no flicker)
const NEAR_DISTANCE = 90;
const LEAVE_DISTANCE = 40;

const panel = ref<HTMLElement>();
const playing = ref(false);
const speed = ref<typeof SPEEDS[number]>(1);
const prefersThin = ref(false);
const near = ref(false);
const scrubbing = ref(false);
let timer: number | undefined;

const thin = computed(() => prefersThin.value || (!near.value && !scrubbing.value));
const away = computed(() => !near.value && !scrubbing.value);
const playerNames = computed(() => Object.fromEntries(props.players.map((player) => [player.color, player.name])) as Partial<Record<Color, string>>);
const currentGeneration = computed(() => props.generations.find((generation) => props.current >= generation.start && props.current < generation.start + generation.count));
const generationText = computed(() => translateTextWithParams('Generation ${0}', [String(currentGeneration.value?.number ?? 1)]));
const shortGeneration = computed(() => translateTextWithParams('G${0}', [String(currentGeneration.value?.number ?? 1)]));
const stepText = computed(() => translateTextWithParams('Step ${0} of ${1}', [String(props.current + 1), String(props.count)]));
const currentRatings = computed(() => props.terraformRatings.map((rating) => ({color: rating.color, value: rating.values[props.current]})));
const temperatureText = computed(() => `${props.temperature > 0 ? '+' : props.temperature < 0 ? '−' : ''}${Math.abs(props.temperature)} °C`);
const playLabel = computed(() => translateText(playing.value ? 'Pause playback' : 'Start playback'));
const sizeToggleLabel = computed(() => translateText(prefersThin.value ? 'Show full' : 'Show thin'));

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
  }, STEP_MS / speed.value);
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
function setSpeed(option: typeof SPEEDS[number]): void {
  speed.value = option;
  if (playing.value) {
    stop();
    play();
  }
}
const toggleSize = () => prefersThin.value = !prefersThin.value;
function onScrubbing(active: boolean): void {
  scrubbing.value = active;
  if (active) {
    stop();
  }
}

function onPointerMove(event: PointerEvent): void {
  if (event.pointerType !== 'mouse' || panel.value === undefined) {
    return;
  }
  const rect = panel.value.getBoundingClientRect();
  const dx = Math.max(rect.left - event.clientX, 0, event.clientX - rect.right);
  const dy = Math.max(rect.top - event.clientY, 0, event.clientY - rect.bottom);
  near.value = Math.hypot(dx, dy) < (near.value ? LEAVE_DISTANCE : NEAR_DISTANCE);
}
// Touch: a tap on the bar unfolds it, a tap elsewhere folds it again
function onPointerDown(event: PointerEvent): void {
  if (event.pointerType !== 'mouse' && panel.value !== undefined) {
    near.value = panel.value.contains(event.target as Node);
  }
}
const onMouseLeave = () => near.value = false;
function onKeyDown(event: KeyboardEvent): void {
  // An open dialog over the replay (enlarged Mars, card zoom) handles its own keys, Escape closes it first
  if (document.querySelector('.board-zoom-backdrop, [role="dialog"][aria-modal="true"]') !== null) {
    return;
  }
  if (event.key === 'Escape') {
    event.preventDefault();
    emit('close');
  } else if (event.key === ' ') {
    event.preventDefault();
    togglePlay();
  } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    const direction = event.key === 'ArrowLeft' ? -1 : 1;
    if (event.shiftKey) {
      generationStep(direction);
    } else {
      step(direction);
    }
  } else {
    return;
  }
  // The results page and the game's own shortcuts don't see these keys while the replay is open
  event.stopImmediatePropagation();
}

onMounted(() => {
  document.addEventListener('pointermove', onPointerMove);
  document.addEventListener('pointerdown', onPointerDown);
  document.documentElement.addEventListener('mouseleave', onMouseLeave);
  window.addEventListener('keydown', onKeyDown, true);
});
onBeforeUnmount(() => {
  stop();
  document.removeEventListener('pointermove', onPointerMove);
  document.removeEventListener('pointerdown', onPointerDown);
  document.documentElement.removeEventListener('mouseleave', onMouseLeave);
  window.removeEventListener('keydown', onKeyDown, true);
});
defineExpose({togglePlay, step, generationStep});
</script>
