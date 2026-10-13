<template>
  <!-- Two-step instead of a browser dialog: the first click asks, only the second deletes.
       Also used for the bulk actions (label + count). -->
  <!-- All three texts lie on top of each other in the same grid cell, only the current one is visible:
       the button is as wide as its longest text from the start and does not jump when asking. -->
  <button type="button" class="btn games-overview-delete" :class="isConfirming ? 'btn-tone-danger' : 'btn-tone-quiet'" :disabled="isDeleting || isDisabled" @click="onClick">
    <span v-for="state in states" :key="state.key" class="games-overview-delete-label" :class="{'games-overview-delete-label--active': state.key === currentState}" :aria-hidden="state.key !== currentState">{{ state.text }}</span>
  </button>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {translateText} from '@/client/directives/i18n';

// How long the confirmation stays; afterwards the button reverts by itself
const confirmWindowMs = 4000;

type DeleteState = 'idle' | 'confirm' | 'deleting';

export default defineComponent({
  name: 'DeleteGameButton',
  emits: ['delete'],
  props: {
    isDeleting: {
      type: Boolean,
      default: false,
    },
    label: {
      type: String,
      default: 'Delete',
    },
    // Number of games affected (bulk actions); nothing to delete disables the button
    count: {
      type: Number,
      default: undefined,
    },
  },
  data() {
    return {
      isConfirming: false,
      resetTimer: undefined as ReturnType<typeof setTimeout> | undefined,
    };
  },
  computed: {
    isDisabled(): boolean {
      return this.count === 0;
    },
    currentState(): DeleteState {
      return this.isDeleting ? 'deleting' : this.isConfirming ? 'confirm' : 'idle';
    },
    // Number of games in brackets only before deleting, as before
    states(): ReadonlyArray<{key: DeleteState, text: string}> {
      const countSuffix = this.count === undefined ? '' : ` (${this.count})`;
      return [
        {key: 'idle', text: translateText(this.label) + countSuffix},
        {key: 'confirm', text: translateText('Really delete?') + countSuffix},
        {key: 'deleting', text: translateText('Deleting…')},
      ];
    },
  },
  beforeUnmount() {
    clearTimeout(this.resetTimer);
  },
  methods: {
    onClick() {
      clearTimeout(this.resetTimer);
      if (this.isConfirming) {
        this.isConfirming = false;
        this.$emit('delete');
        return;
      }
      this.isConfirming = true;
      this.resetTimer = setTimeout(() => {
        this.isConfirming = false;
      }, confirmWindowMs);
    },
  },
});
</script>
