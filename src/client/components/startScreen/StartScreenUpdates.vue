<template>
  <!-- Latest updates from the feature log (feature-log.json of the showcase site). Desktop: column at the right edge,
     faint until the mouse comes near; narrow windows: below the menu. Without the file there is no column. -->
  <aside v-if="days.length > 0"
    ref="panel"
    class="start-updates"
    :style="{'--near': near, 'top': top}"
    :aria-label="texts.heading">
    <div class="start-updates-head">
      <h2 class="start-updates-heading">{{ texts.heading }}</h2>
      <a class="start-updates-all" :href="featureLogUrl" target="_blank" rel="noopener">{{ texts.all }} →</a>
    </div>
    <div class="start-updates-days">
      <div v-for="(day, index) in days"
        :key="day.date"
        class="start-updates-day"
        :class="{'start-updates-day--newest': index === 0, 'start-updates-day--open': index === openIndex}"
        tabindex="0"
        role="button"
        :aria-expanded="index === openIndex"
        @click="onDayClick($event, index)"
        @keydown.enter.prevent="toggleDay(index)"
        @keydown.space.prevent="toggleDay(index)">
        <span class="start-updates-date">{{ day.shortDate }}</span>
        <span class="start-updates-title">{{ day.title }}<span class="start-updates-count">{{ day.items.length }}</span></span>
        <span class="start-updates-chevron" aria-hidden="true">›</span>
        <div class="start-updates-sheet" :class="{'start-updates-sheet--sunday': day.sunday}" aria-hidden="true">
          <span class="start-updates-sheet-month">{{ day.month }}</span>
          <span class="start-updates-sheet-day">{{ day.dayOfMonth }}</span>
          <span class="start-updates-sheet-weekday">{{ day.weekday }}</span>
        </div>
        <!-- Extra wrapper: the grid row animates from 0fr to 1fr, the list keeps its own spacing -->
        <div class="start-updates-body">
          <div>
            <ul class="start-updates-items">
              <li v-for="item in day.items" :key="item" :title="item">{{ item }}</li>
              <!-- Commits of the day as the last line of the list (not on the sheet, where it was too small to read) -->
              <li v-if="day.commits > 0" class="start-updates-commits">{{ day.commits }} {{ day.commitsLabel }}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import {computed, nextTick, onBeforeUnmount, onMounted, ref} from 'vue';
import {getPreferences} from '@/client/utils/PreferencesManager';
import {FEATURE_LOG_URL} from '@/client/utils/ShowcaseLinks';
import {FEATURE_LOG_TEXTS, FeatureLogDay, featureLogLanguage, loadFeatureLog, presentDay} from '@/client/components/startScreen/featureLog';

const props = withDefaults(defineProps<{
  // Tests pass the days directly instead of loading them
  initialDays?: ReadonlyArray<FeatureLogDay>,
}>(), {initialDays: undefined});

// Two weeks; older days are on the feature log page ("All")
const DAYS_SHOWN = 14;
// From this distance (px) to the column on, it stays at its resting state (half off screen, faint, blurred)
const NEAR_RANGE = 220;
// Größe bei voller Nähe – muss zu --updates-scale in start_updates.less passen
const NEAR_SCALE = 1.2;

const language = featureLogLanguage(getPreferences().lang);
const texts = FEATURE_LOG_TEXTS[language];
const featureLogUrl = FEATURE_LOG_URL;

const loadedDays = ref<ReadonlyArray<FeatureLogDay>>(props.initialDays ?? []);
const days = computed(() => loadedDays.value.slice(0, DAYS_SHOWN).map((day) => presentDay(day, language)));

const panel = ref<HTMLElement | undefined>(undefined);

// 0 = mouse far away, 1 = mouse at or over the column
const near = ref(0);
// Panel metrics cached by measure(): reading offset* per pointer move forced a layout every time
const metrics = {width: 0, height: 0, right: 0, top: 0};
let pointerX = 0;
let pointerY = 0;
let pointerFrame = 0;

function updateNear(): void {
  pointerFrame = 0;
  if (metrics.width === 0) {
    return;
  }
  // Abstand zur voll eingeblendeten Lage, nicht zur sichtbaren: die Spalte fährt der Maus entgegen, sonst
  // schaukelte sich die Nähe selbst hoch.
  const dx = Math.max(metrics.right - metrics.width - pointerX, 0);
  const dy = Math.max(metrics.top - pointerY, 0, pointerY - metrics.top - metrics.height);
  near.value = Math.round(Math.max(0, 1 - Math.hypot(dx, dy) / NEAR_RANGE) * 100) / 100;
}

function onMouseMove(event: MouseEvent): void {
  pointerX = event.clientX;
  pointerY = event.clientY;
  if (pointerFrame === 0) {
    pointerFrame = requestAnimationFrame(updateNear);
  }
}
function onMouseOut(event: MouseEvent): void {
  if (event.relatedTarget === null) {
    near.value = 0;
  }
}

// Akkordeon: höchstens ein Tag offen, anfangs der neueste. Öffnen per Klick/Tap statt Hover – Hover wechselte
// den Eintrag schon beim Drüberfahren, das wirkte unruhig. Erneuter Klick schließt den offenen Tag.
const openIndex = ref<number | undefined>(0);
function toggleDay(index: number): void {
  openIndex.value = openIndex.value === index ? undefined : index;
  // The height of the open day changes the panel: refresh the cached metrics for the pointer math
  void nextTick(measure);
}
// Klicks in die Liste der Punkte schalten nicht um: wer Text markiert oder liest, soll ihn nicht zuklappen
function onDayClick(event: MouseEvent, index: number): void {
  if (event.target instanceof Element && event.target.closest('.start-updates-body') !== null) {
    return;
  }
  toggleDay(index);
}

// Vertically centred at rest (newest day open); opening another day changes the height only by the difference
// of the two days. Voll eingeblendet wächst die Spalte um die Mitte – dafür oben Platz lassen.
// Only for the fixed column on wide windows, below the menu it is part of the page flow.
const top = ref<string | undefined>(undefined);
function measure(): void {
  const element = panel.value;
  if (element === undefined || getComputedStyle(element).position !== 'fixed') {
    top.value = undefined;
    metrics.width = 0;
    return;
  }
  const width = element.offsetWidth * NEAR_SCALE;
  const height = element.offsetHeight * NEAR_SCALE;
  metrics.width = width;
  metrics.height = height;
  metrics.right = element.offsetLeft + element.offsetWidth;
  metrics.top = element.offsetTop + (element.offsetHeight - height) / 2;
  const growth = (NEAR_SCALE - 1) / 2 * element.offsetHeight;
  top.value = `${Math.max(16 + growth, (window.innerHeight - element.offsetHeight) / 2)}px`;
}

onMounted(async () => {
  window.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseout', onMouseOut);
  window.addEventListener('resize', measure);
  if (props.initialDays === undefined) {
    loadedDays.value = await loadFeatureLog();
  }
  await nextTick();
  measure();
});

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mouseout', onMouseOut);
  window.removeEventListener('resize', measure);
  if (pointerFrame !== 0) {
    cancelAnimationFrame(pointerFrame);
  }
});
</script>
