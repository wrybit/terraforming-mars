<template>
<!-- Latest updates from the feature log (feature-log.json of the showcase site). Desktop: column at the right edge,
     faint until the mouse comes near; narrow windows: below the menu. Without the file there is no column. -->
<aside v-if="days.length > 0"
  ref="panel"
  class="start-updates"
  :style="{'--near': near, '--shift': `${shift}px`, 'top': top}"
  :aria-label="texts.heading">
  <div class="start-updates-head">
    <h2 class="start-updates-heading">{{ texts.heading }}</h2>
    <a class="start-updates-all" :href="featureLogUrl" target="_blank" rel="noopener">{{ texts.all }} →</a>
  </div>
  <div class="start-updates-days" @mouseleave="shift = 0">
    <div v-for="(day, index) in days"
      :key="day.date"
      class="start-updates-day"
      :class="{'start-updates-day--newest': index === 0}"
      tabindex="0"
      @mouseenter="onDayEnter(index)">
      <span class="start-updates-date">{{ day.shortDate }}</span>
      <span class="start-updates-title">{{ day.title }}<span class="start-updates-count">{{ day.items.length }}</span></span>
      <div class="start-updates-sheet" :class="{'start-updates-sheet--sunday': day.sunday}" aria-hidden="true">
        <span class="start-updates-sheet-month">{{ day.month }}</span>
        <span class="start-updates-sheet-day">{{ day.dayOfMonth }}</span>
        <span class="start-updates-sheet-weekday">{{ day.weekday }}</span>
        <span v-if="day.commits > 0" class="start-updates-sheet-commits"><b>{{ day.commits }}</b>{{ day.commitsLabel }}</span>
      </div>
      <!-- Extra wrapper: the grid row animates from 0fr to 1fr, the list keeps its own spacing -->
      <div class="start-updates-body" :ref="index === 0 ? setNewestBody : undefined">
        <div>
          <ul class="start-updates-items">
            <li v-for="item in day.items" :key="item" :title="item">{{ item }}</li>
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
// From this distance (px) to the column on, it stays at its resting opacity
const NEAR_RANGE = 220;

const language = featureLogLanguage(getPreferences().lang);
const texts = FEATURE_LOG_TEXTS[language];
const featureLogUrl = FEATURE_LOG_URL;

const loadedDays = ref<ReadonlyArray<FeatureLogDay>>(props.initialDays ?? []);
const days = computed(() => loadedDays.value.slice(0, DAYS_SHOWN).map((day) => presentDay(day, language)));

const panel = ref<HTMLElement | undefined>(undefined);
let newestBody: HTMLElement | undefined;
function setNewestBody(element: unknown): void {
  newestBody = element instanceof HTMLElement ? element : undefined;
}

// 0 = mouse far away, 1 = mouse at or over the column
const near = ref(0);
function onMouseMove(event: MouseEvent): void {
  const rect = panel.value?.getBoundingClientRect();
  if (rect === undefined) {
    return;
  }
  const dx = Math.max(rect.left - event.clientX, 0, event.clientX - rect.right);
  const dy = Math.max(rect.top - event.clientY, 0, event.clientY - rect.bottom);
  near.value = Math.round(Math.max(0, 1 - Math.hypot(dx, dy) / NEAR_RANGE) * 100) / 100;
}
function onMouseOut(event: MouseEvent): void {
  if (event.relatedTarget === null) {
    near.value = 0;
  }
}

// The newest day is open at rest. Hovering another day closes it, which would pull every row below up by its
// height – the row under the mouse would change. The column moves down by exactly that height at the same time,
// so the rows stay where they are and only the header and the newest day move.
const shift = ref(0);
let newestBodyHeight = 0;
function onDayEnter(index: number): void {
  shift.value = index === 0 ? 0 : newestBodyHeight;
}

// Vertically centred at rest (newest day open); opening another day then only grows downwards.
// Only for the fixed column on wide windows, below the menu it is part of the page flow.
const top = ref<string | undefined>(undefined);
function measure(): void {
  const element = panel.value;
  if (element === undefined || getComputedStyle(element).position !== 'fixed') {
    top.value = undefined;
    return;
  }
  if (shift.value !== 0) {
    return;
  }
  newestBodyHeight = newestBody?.offsetHeight ?? 0;
  top.value = `${Math.max(16, (window.innerHeight - element.offsetHeight) / 2)}px`;
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
});
</script>
