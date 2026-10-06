<template>
  <!-- Which of the turn's two actions is up: "1st action" / "2nd action" next to the main button in the footer.
       Done steps get a check mark, the current one is highlighted, the next one recedes -->
  <span class="action-step-chips" data-test="action-step-chips">
    <span v-for="number in 2" :key="number" :class="['action-step-chip', 'action-step-chip--' + state(number)]">
      <template v-if="state(number) === 'done'">✓ </template>{{ $t(number === 1 ? '1st action' : '2nd action') }}
    </span>
  </span>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';

export default defineComponent({
  name: 'ActionStepChips',
  props: {
    // Current action of the turn: 1 or 2
    step: {
      type: Number as PropType<1 | 2>,
      required: true,
    },
  },
  methods: {
    state(number: number): 'done' | 'now' | 'next' {
      if (number < this.step) {
        return 'done';
      }
      return number === this.step ? 'now' : 'next';
    },
  },
});
</script>
