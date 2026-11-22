<template>
  <!-- Settings as summary chips (create_game_form.less): picture or icon of their tile, a switch for options without one -->
  <div class="create-game-summary">
    <span v-for="chip in chips" :key="chip.key" class="create-game-summary-chip">
      <img v-if="chip.picture !== undefined" class="create-game-expansion-icon" :src="chip.picture" alt="">
      <span v-else-if="chip.iconClass !== undefined" :class="chip.iconClass"></span>
      <span v-else class="create-game-summary-toggle" aria-hidden="true"></span>
      <span :class="{capitalized: chip.capitalized}" v-i18n>{{ chip.label }}</span>
    </span>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {AiBlockerChip} from './aiBlockerChip';

// Game settings around the AI as chips: what blocks it (create form) or what it can play (admin overview)
export default defineComponent({
  name: 'AiSettingChips',
  props: {
    chips: {type: Array as PropType<ReadonlyArray<AiBlockerChip>>, required: true},
  },
});
</script>
