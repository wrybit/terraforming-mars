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
import {computed, nextTick, onBeforeUnmount, onMounted, ref, watch} from 'vue';
import TrackBonusChip from '@/client/components/trackBonus/TrackBonusChip.vue';
import {BoardName} from '@/common/boards/BoardName';
import {CellPosition, MarsScale, ScaleBonusPin, scaleBonusPins} from './marsScaleBonuses';
import {ScaleGeometry} from './arrakisScales';

const props = defineProps<{
  temperature: number;
  oxygen: number;
  // Undefined without Venus
  venus: number | undefined;
  boardName: BoardName;
  // Larger dial (Amazonis Planitia, .global-numbers--large)
  large: boolean;
  // Arrakis: its markers sit on its own circle and angles (arrakisScales.ts), the large one on the bigger circle
  geometry?: ScaleGeometry;
  // Arrakis: a full scale shows only its check, its chips go (Jens, 20 Oct 2026)
  hideComplete?: boolean;
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

// Positions of the scale cells, read from their margins (globs.less places them): one source for cells and chips.
// Computed style also works while the board is hidden (other tab).
const cells = ref<Record<string, CellPosition>>({});

function readCells() {
  const numbers = root.value?.parentElement;
  if (numbers === null || numbers === undefined) {
    return;
  }
  const result: Record<string, CellPosition> = {};
  for (const cell of Array.from(numbers.querySelectorAll<HTMLElement>('.global-numbers-value'))) {
    const scale = (['temperature', 'oxygen', 'venus'] as const).find((name) => cell.parentElement?.classList.contains('global-numbers-' + name));
    const value = Array.from(cell.classList).find((name) => /^val--?[0-9]+$/.test(name))?.slice(4);
    if (scale === undefined || value === undefined) {
      continue;
    }
    const style = getComputedStyle(cell);
    const top = parseFloat(style.marginTop);
    const left = parseFloat(style.marginLeft);
    if (Number.isFinite(top) && Number.isFinite(left)) {
      result[scale + value] = [top, left];
    }
  }
  cells.value = result;
}

// Other map or dial size: the cells move
watch(() => [props.boardName, props.large, props.venus === undefined], () => nextTick(readCells));

onMounted(() => {
  readCells();
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

const pins = computed(() => scaleBonusPins({
  values: {temperature: props.temperature, oxygen: props.oxygen, venus: props.venus},
  boardName: props.boardName,
  large: props.large,
  cell: (scale: MarsScale, value: number) => cells.value[scale + value],
  geometry: props.geometry,
}).filter((pin) => props.hideComplete !== true || !pin.scaleComplete));

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
