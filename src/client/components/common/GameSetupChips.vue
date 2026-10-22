<template>
  <div class="create-game-summary" :class="{'create-game-summary--compact': compact}">
    <component :is="chip.statsHref !== undefined ? 'a' : 'span'" v-for="chip in chips" :key="chip.key"
      :class="['create-game-summary-chip', {'create-game-summary-chip--icon': chip.iconOnly}]" :href="chip.statsHref"
      :data-stats-link="chip.statsHref !== undefined ? '' : undefined"
      v-glass-tooltip="chip.iconOnly ? chip.label : ''" :aria-label="chip.iconOnly ? chip.label : undefined">
      <SeatIcon v-if="chip.seatIcon !== undefined" :kind="chip.seatIcon"/>
      <span v-if="chip.iconClass !== undefined" :class="chip.iconClass"></span>
      <span v-else-if="chip.toggle" class="create-game-summary-toggle" aria-hidden="true"></span>
      <span v-if="!chip.iconOnly" :class="{capitalized: chip.capitalized}">{{ chip.label }}</span>
    </component>
  </div>
</template>

<script setup lang="ts">
import SeatIcon from '@/client/components/create/SeatIcon.vue';
import {GameSetupChip} from './gameSetupChips';
import {glassTooltip as vGlassTooltip} from '@/client/directives/GlassTooltip';

// Setup of a game as plain chips (gameSetupChips.ts); compact: smaller for table rows.
// Expansions are icon-only chips with the frosted-glass tooltip (the native title takes too long to show).
// One root element without a comment before it, so classes passed in land on the chip row.

defineProps<{
  chips: ReadonlyArray<GameSetupChip>;
  compact?: boolean;
}>();
</script>
