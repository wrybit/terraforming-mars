<template>
  <!-- Bonuses next to the Mars scales (marsScaleBonuses.ts): chip outside, connector pointing at the cell,
       handed out ones grey. Same chip and pin as the Moon ring and the track rows (track_bonus.less). -->
  <!-- display: contents wrapper: carries the counter-scale for the chips (same size on every zoom, like the Moon) -->
  <span ref="root" class="mars-scale-bonuses" :style="{'--mars-chip-scale': String(chipScale)}">
  <div v-for="pin in pins" :key="pin.key" class="mars-scale-bonus" :style="pinStyle(pin)" :data-test="'mars-scale-bonus-' + pin.key">
    <span :class="['track-bonus-pin', {'track-bonus-pin--done': pin.done}]">
      <span class="track-bonus-pin__chips" :style="{transform: 'rotate(' + -pin.angle + 'deg)'}">
        <TrackBonusChip :bonus="pin.bonus" :kind="pin.done ? 'done' : 'own'"/>
      </span>
      <span class="track-bonus-link"></span>
    </span>
  </div>
  </span>
</template>

<script setup lang="ts">
import {computed, onBeforeUnmount, onMounted, ref} from 'vue';
import TrackBonusChip from '@/client/components/trackBonus/TrackBonusChip.vue';
import {ScaleBonusPin, scaleBonusPins} from './marsScaleBonuses';

const props = defineProps<{
  temperature: number;
  oxygen: number;
  // Undefined without Venus
  venus: number | undefined;
}>();

// The board is zoomed (rightColumnFit.ts, zoom view): undo that for the chips so they keep their size
const root = ref<HTMLElement>();
const chipScale = ref(1);
let observer: ResizeObserver | undefined;

function measure(board: HTMLElement) {
  const width = board.getBoundingClientRect().width;
  if (width > 0 && board.offsetWidth > 0) {
    chipScale.value = Math.round(board.offsetWidth / width * 1000) / 1000;
  }
}

onMounted(() => {
  const board = root.value?.closest<HTMLElement>('.board-cont');
  if (board === null || board === undefined) {
    return;
  }
  measure(board);
  if (typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(() => measure(board));
    observer.observe(board);
  }
});

onBeforeUnmount(() => observer?.disconnect());

const pins = computed(() => scaleBonusPins({temperature: props.temperature, oxygen: props.oxygen, venus: props.venus}));

// Placed like the scale cells (margins in .global-numbers), then turned so the connector points at the cell
function pinStyle(pin: ScaleBonusPin): Record<string, string> {
  return {
    marginTop: pin.top + 'px',
    marginLeft: pin.left + 'px',
    // Counter-scale last: around the connector tip, so the tip stays at the cell
    transform: `translate(-100%, -50%) rotate(${pin.angle}deg) scale(var(--mars-chip-scale, 1))`,
  };
}
</script>
