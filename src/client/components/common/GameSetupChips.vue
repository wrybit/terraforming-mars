<template>
  <div class="create-game-summary" :class="{'create-game-summary--compact': compact}">
    <component :is="chip.statsHref !== undefined ? 'a' : 'span'" v-for="chip in chips" :key="chip.key"
      class="create-game-summary-chip" :href="chip.statsHref" :data-stats-link="chip.statsHref !== undefined ? '' : undefined">
      <SeatIcon v-if="chip.seatIcon !== undefined" :kind="chip.seatIcon"/>
      <span v-if="chip.iconClass !== undefined" :class="chip.iconClass"></span>
      <span :class="{capitalized: chip.capitalized}">{{ chip.label }}</span>
    </component>
  </div>
</template>

<script setup lang="ts">
import SeatIcon from '@/client/components/create/SeatIcon.vue';
import {GameSetupChip} from './gameSetupChips';

// Setup of a game as plain chips (gameSetupChips.ts); compact: smaller for table rows.
// One root element without a comment before it, so classes passed in land on the chip row.

defineProps<{
  chips: ReadonlyArray<GameSetupChip>;
  compact?: boolean;
}>();
</script>
