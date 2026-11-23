<template>
  <!-- Live load of the machine above the AI settings: change threads or rollouts, watch the cores fill up.
       Processor, cores and memory side by side on wide screens, one below the other on narrow ones -->
  <section class="ai-load" :aria-label="$t('Server load, live')">
    <div class="ai-load-head">
      <h3 class="ai-load-title" v-i18n>Server load, live</h3>
      <span v-if="latest !== undefined" class="ai-load-machine">{{ machineText }}</span>
    </div>
    <p v-if="failure !== ''" class="ai-load-failure">{{ failure }}</p>
    <div v-if="latest !== undefined" class="ai-load-parts">
      <div class="ai-load-part">
        <!-- Processor over the last minute, stacked: AI at the bottom, so its share reads straight off the axis -->
        <div class="ai-load-chart-head">
          <span class="ai-load-label" v-i18n>Processor</span>
          <span class="ai-load-value">{{ latest.cpu.totalPercent.toFixed(0) }} %</span>
        </div>
        <div class="ai-load-chart" @mousemove="hover" @mouseleave="hoverIndex = undefined">
          <svg class="ai-load-svg" :viewBox="`0 0 ${WIDTH} ${HEIGHT}`" preserveAspectRatio="none" role="img" :aria-label="chartLabel">
            <line v-for="level in [25, 50, 75]" :key="level" class="ai-load-grid" x1="0" :x2="WIDTH" :y1="HEIGHT - level / 100 * HEIGHT" :y2="HEIGHT - level / 100 * HEIGHT" />
            <path v-for="layer in layers" :key="layer.kind" class="ai-load-area" :class="'ai-load-area--' + layer.kind" :d="paths[layer.kind]" />
            <line v-if="hoverX !== undefined" class="ai-load-crosshair" :x1="hoverX" :x2="hoverX" y1="0" :y2="HEIGHT" />
          </svg>
          <div class="ai-load-axis" aria-hidden="true"><span>100 %</span><span>50 %</span><span>0 %</span></div>
          <div v-if="hovered !== undefined" class="ai-load-tooltip" :style="{left: tooltipLeft}">
            <strong>{{ secondsAgo(hovered) }}</strong>
            <span v-for="layer in [...layers].reverse()" :key="layer.kind"><i class="dashboard-split-swatch" :class="'dashboard-split-segment--' + layer.kind"></i>{{ $t(layer.label) }} {{ partsOf(hovered)[layer.kind].toFixed(0) }} %</span>
          </div>
        </div>
        <!-- Legend always present, with the current value of each part -->
        <div class="ai-load-legend">
          <span v-for="layer in [...layers].reverse()" :key="layer.kind" class="ai-load-legend-item">
            <i class="dashboard-split-swatch" :class="'dashboard-split-segment--' + layer.kind"></i>
            <span v-i18n>{{ layer.label }}</span>
            <span class="ai-load-legend-value">{{ partsOf(latest)[layer.kind].toFixed(0) }} %</span>
          </span>
        </div>
        <p v-if="latest.cpu.aiPercent === undefined" class="ai-load-note" v-i18n>The AI share is only measured on Linux servers.</p>
      </div>
      <div class="ai-load-part">
        <!-- One bar per core: shows whether the AI threads spread over the machine or wait for each other -->
        <div class="ai-load-chart-head">
          <span class="ai-load-label" v-i18n>Cores</span>
          <span class="ai-load-value">{{ latest.cores }}</span>
        </div>
        <div class="ai-load-cores">
          <div v-for="(value, index) in latest.corePercent" :key="index" class="ai-load-core" :title="`${index + 1}: ${value.toFixed(0)} %`">
            <div class="ai-load-core-fill" :class="{'ai-load-core-fill--full': value >= FULL_CORE_PERCENT}" :style="{height: value + '%'}"></div>
          </div>
        </div>
        <!-- What the two bar colors mean: gray the load of a core, yellow a core that is (almost) full -->
        <div class="ai-load-legend">
          <span class="ai-load-legend-item"><i class="dashboard-split-swatch ai-load-core-swatch"></i><span v-i18n>Load per core</span></span>
          <span class="ai-load-legend-item"><i class="dashboard-split-swatch ai-load-core-swatch ai-load-core-swatch--full"></i><span v-i18n>90 % or more</span></span>
        </div>
      </div>
      <div class="ai-load-part">
        <DashboardSplitBar label="Memory" :segments="memorySegments" :total="latest.memory.totalBytes" />
      </div>
    </div>
    <p v-else-if="failure === ''" class="ai-load-note" v-i18n>Loading…</p>
  </section>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {paths} from '@/common/app/paths';
import {LiveLoadSample} from '@/common/admin/LiveLoad';
import {describeFailure, failureOf, fetchOrFail} from '@/client/utils/requestFailure';
import {translateTextWithParams} from '@/client/directives/i18n';
import DashboardSplitBar from '@/client/components/admin/dashboard/DashboardSplitBar.vue';
import {UsageSegment} from '@/client/components/admin/dashboard/usageSegments';
import {LIVE_LOAD_WINDOW, LOAD_LAYERS, LoadLayerKind, liveMemorySegments, loadParts, sampleAt, stackedAreaPaths} from '@/client/components/admin/liveLoadSeries';

// Coordinates of the drawing; the SVG stretches to the width of its column
const WIDTH = 600;
const HEIGHT = 140;
const POLL_MILLISECONDS = 1000;
// A core this busy is marked yellow: more threads would only wait for it
const FULL_CORE_PERCENT = 90;

type DataModel = {
  samples: Array<LiveLoadSample>,
  failure: string,
  hoverIndex: number | undefined,
  timer: number | undefined,
  stopped: boolean,
};

export default defineComponent({
  name: 'AiLoadGraph',
  components: {DashboardSplitBar},
  emits: ['measured'],
  data(): DataModel {
    return {samples: [], failure: '', hoverIndex: undefined, timer: undefined, stopped: false};
  },
  computed: {
    WIDTH(): number {
      return WIDTH;
    },
    HEIGHT(): number {
      return HEIGHT;
    },
    FULL_CORE_PERCENT(): number {
      return FULL_CORE_PERCENT;
    },
    layers(): typeof LOAD_LAYERS {
      return LOAD_LAYERS;
    },
    latest(): LiveLoadSample | undefined {
      return this.samples[this.samples.length - 1];
    },
    paths(): Record<LoadLayerKind, string> {
      return stackedAreaPaths(this.samples, WIDTH, HEIGHT);
    },
    machineText(): string {
      const latest = this.latest;
      if (latest === undefined) {
        return '';
      }
      return translateTextWithParams('${0} · ${1} AI bots running', [latest.processorModel, String(latest.aiBots)]);
    },
    chartLabel(): string {
      return translateTextWithParams('Processor over the last ${0} seconds', [String(LIVE_LOAD_WINDOW)]);
    },
    hovered(): LiveLoadSample | undefined {
      return this.hoverIndex === undefined ? undefined : this.samples[this.hoverIndex];
    },
    hoverX(): number | undefined {
      if (this.hoverIndex === undefined) {
        return undefined;
      }
      return WIDTH - (this.samples.length - 1 - this.hoverIndex) * WIDTH / (LIVE_LOAD_WINDOW - 1);
    },
    // The tooltip stays inside the chart: it flips to the left side of the crosshair in the right half
    tooltipLeft(): string {
      const share = (this.hoverX ?? 0) / WIDTH;
      return share > 0.5 ? `calc(${share * 100}% - 8px - var(--ai-load-tooltip-width))` : `calc(${share * 100}% + 8px)`;
    },
    memorySegments(): Array<UsageSegment> {
      return this.latest === undefined ? [] : liveMemorySegments(this.latest);
    },
  },
  mounted() {
    void this.poll();
  },
  beforeUnmount() {
    this.stopped = true;
    window.clearTimeout(this.timer);
  },
  methods: {
    partsOf(sample: LiveLoadSample): Record<LoadLayerKind, number> {
      return loadParts(sample);
    },
    secondsAgo(sample: LiveLoadSample): string {
      const latest = this.latest;
      const seconds = latest === undefined ? 0 : Math.round((latest.measuredAtMs - sample.measuredAtMs) / 1000);
      return seconds === 0 ? this.$t('Now') : translateTextWithParams('${0} s ago', [String(seconds)]);
    },
    hover(event: MouseEvent): void {
      const box = (event.currentTarget as HTMLElement).getBoundingClientRect();
      this.hoverIndex = box.width <= 0 ? undefined : sampleAt((event.clientX - box.left) / box.width, this.samples.length);
    },
    async poll(): Promise<void> {
      // A hidden browser tab measures nothing: no load for a page nobody looks at
      if (!document.hidden) {
        try {
          const sample: LiveLoadSample = await (await fetchOrFail(paths.API_ADMIN_LIVE_LOAD, {cache: 'no-store'})).json();
          this.samples = [...this.samples, sample].slice(-LIVE_LOAD_WINDOW);
          this.failure = '';
          this.$emit('measured', sample);
        } catch (error) {
          this.failure = describeFailure(failureOf(error));
        }
      }
      if (!this.stopped) {
        this.timer = window.setTimeout(() => void this.poll(), POLL_MILLISECONDS);
      }
    },
  },
});
</script>
