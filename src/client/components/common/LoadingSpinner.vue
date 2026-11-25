<template>
  <!-- Turning ring above "Loading…", in the middle of the space it fills (a card, or a whole page with the modifier) -->
  <div class="loading-spinner" :class="{'loading-spinner--page': page}" role="status">
    <span class="loading-spinner-ring" aria-hidden="true"></span>
    <span v-i18n>Loading…</span>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';

// Content of one card or page still on its way: the place is already there, the spinner sits in its middle
export default defineComponent({
  name: 'LoadingSpinner',
  props: {
    // Whole page: centred in the visible height below the navigation instead of only in its card
    page: {type: Boolean, default: false},
  },
});
</script>
