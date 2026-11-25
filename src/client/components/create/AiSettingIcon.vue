<template>
  <!-- Picture or icon of the setting's tile, a switch for options without one (create_game_form.less) -->
  <img v-if="chip.picture !== undefined" class="create-game-expansion-icon" :src="chip.picture" alt="">
  <span v-else-if="chip.iconClass !== undefined" :class="chip.iconClass"></span>
  <span v-else class="create-game-summary-toggle" aria-hidden="true"></span>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {AiBlockerChip} from './aiBlockerChip';

// Icon of one game setting: shared by the chips (create form) and the rows of the admin overview
export default defineComponent({
  name: 'AiSettingIcon',
  props: {
    chip: {type: Object as PropType<AiBlockerChip>, required: true},
  },
});
</script>
