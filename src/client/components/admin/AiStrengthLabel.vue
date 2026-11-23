<template>
  <!-- An AI strength as players see it in the game: robot, name and the marker behind AI names ("[AI+]") -->
  <span class="ai-strength-label">
    <SeatIcon v-if="marker !== undefined" kind="ai" :size="14" />
    <span v-i18n>{{ label }}</span>
    <span v-if="marker !== undefined" class="ai-strength-label-marker">{{ marker }}</span>
  </span>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import SeatIcon from '@/client/components/create/SeatIcon.vue';
import {aiPlayerMarker, isAiLevel} from '@/common/ai/AiLevel';
import {strengthColumnLabel} from '@/client/components/admin/aiStrengthColumns';

export default defineComponent({
  name: 'AiStrengthLabel',
  components: {SeatIcon},
  props: {
    /** Column of a settings table: an AI strength (easy, normal, hard) or any other id */
    column: {type: String, required: true},
  },
  computed: {
    label(): string {
      return strengthColumnLabel(this.column);
    },
    marker(): string | undefined {
      return isAiLevel(this.column) ? aiPlayerMarker(this.column) : undefined;
    },
  },
});
</script>
