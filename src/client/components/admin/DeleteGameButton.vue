<template>
  <!-- Two-step instead of a browser dialog: the first click asks, only the second deletes -->
  <button type="button" class="btn games-overview-delete" :class="isConfirming ? 'btn-tone-danger' : 'btn-tone-quiet'" :disabled="isDeleting" @click="onClick">
    {{ isDeleting ? 'Deleting…' : isConfirming ? 'Really delete?' : 'Delete' }}
  </button>
</template>

<script lang="ts">
import {defineComponent} from 'vue';

// How long the confirmation stays; afterwards the button reverts by itself
const confirmWindowMs = 4000;

export default defineComponent({
  name: 'DeleteGameButton',
  emits: ['delete'],
  props: {
    isDeleting: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      isConfirming: false,
      resetTimer: undefined as ReturnType<typeof setTimeout> | undefined,
    };
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
