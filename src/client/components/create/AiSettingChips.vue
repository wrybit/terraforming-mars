<template>
  <!-- Settings as summary chips (create_game_form.less): picture or icon of their tile, a switch for options without one -->
  <div class="create-game-summary">
    <span v-for="chip in chips" :key="chip.key" class="create-game-summary-chip">
      <AiSettingIcon :chip="chip" />
      <span :class="{capitalized: chip.capitalized}" v-i18n>{{ chip.label }}</span>
    </span>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {AiBlockerChip} from './aiBlockerChip';
import AiSettingIcon from './AiSettingIcon.vue';

// Game settings around the AI as chips: what blocks the AI (create form)
export default defineComponent({
  name: 'AiSettingChips',
  components: {AiSettingIcon},
  props: {
    chips: {type: Array as PropType<ReadonlyArray<AiBlockerChip>>, required: true},
  },
});
</script>
