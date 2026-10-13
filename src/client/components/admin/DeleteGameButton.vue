<template>
  <!-- Two-step instead of a browser dialog: the first click asks, only the second deletes.
       Also used for the bulk actions (label + count). -->
  <button type="button" class="btn games-overview-delete" :class="isConfirming ? 'btn-tone-danger' : 'btn-tone-quiet'" :disabled="isDeleting || isDisabled" @click="onClick">
    {{ $t(isDeleting ? 'Deleting…' : isConfirming ? 'Really delete?' : label) }}<template v-if="count !== undefined && !isDeleting"> ({{ count }})</template>
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
