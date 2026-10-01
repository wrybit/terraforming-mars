<template>
  <!-- Zweistufig statt Browser-Dialog: erster Klick fragt nach, erst der zweite löscht -->
  <button type="button" class="btn games-overview-delete" :class="isConfirming ? 'btn-tone-danger' : 'btn-tone-quiet'" :disabled="isDeleting" @click="onClick">
    {{ isDeleting ? 'Deleting…' : isConfirming ? 'Really delete?' : 'Delete' }}
  </button>
</template>

<script lang="ts">
import {defineComponent} from 'vue';

// So lange bleibt die Rückfrage stehen, danach fällt der Button von selbst zurück
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
