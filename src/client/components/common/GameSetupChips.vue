<template>
  <div class="create-game-summary" :class="{'create-game-summary--compact': compact}">
    <component :is="chip.statsHref !== undefined ? 'a' : 'span'" v-for="chip in chips" :key="chip.key"
      :class="['create-game-summary-chip', {'create-game-summary-chip--icon': iconOnly(chip)}]" :href="chip.statsHref"
      :data-stats-link="chip.statsHref !== undefined ? '' : undefined"
      v-glass-tooltip="iconOnly(chip) ? chip.label : ''" :aria-label="iconOnly(chip) ? chip.label : undefined">
      <SeatIcon v-if="chip.seatIcon !== undefined" :kind="chip.seatIcon" />
      <span v-if="chip.iconClass !== undefined" :class="chip.iconClass"></span>
      <img v-else-if="chip.picture !== undefined" class="create-game-expansion-icon" :src="chip.picture" alt="">
      <span v-else-if="chip.toggle" class="create-game-summary-toggle" aria-hidden="true"></span>
      <span v-if="!iconOnly(chip)" :class="{capitalized: chip.capitalized}">{{ chip.label }}</span>
    </component>
  </div>
</template>

<script setup lang="ts">
import {onBeforeUnmount, onMounted, ref} from 'vue';
import SeatIcon from '@/client/components/create/SeatIcon.vue';
import {GameSetupChip} from './gameSetupChips';
import {glassTooltip as vGlassTooltip} from '@/client/directives/GlassTooltip';

// Setup of a game as plain chips (gameSetupChips.ts); compact: smaller for table rows.
// Expansions are icon-only chips with the frosted-glass tooltip (the native title takes too long to show).
// writtenOut: expansions with their names (a long list is fine); only on narrow screens the icon-only fallback.
// One root element without a comment before it, so classes passed in land on the chip row.

const props = defineProps<{
  chips: ReadonlyArray<GameSetupChip>;
  compact?: boolean;
  writtenOut?: boolean;
}>();

// Same width as the lobby rows' phone layout (lobby.less)
const NARROW_QUERY = '(max-width: 700px)';
const narrow = ref(false);
let query: MediaQueryList | undefined;
const onQueryChange = () => narrow.value = query?.matches === true;

function iconOnly(chip: GameSetupChip): boolean {
  return chip.iconOnly === true && (props.writtenOut !== true || narrow.value);
}

onMounted(() => {
  if (props.writtenOut === true && typeof window.matchMedia === 'function') {
    query = window.matchMedia(NARROW_QUERY);
    onQueryChange();
    query.addEventListener('change', onQueryChange);
  }
});

onBeforeUnmount(() => query?.removeEventListener('change', onQueryChange));
</script>
