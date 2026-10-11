<template>
  <!-- In the middle of the screen on a small dark plate: "Loading…" above the running bar (start_preloader.less) -->
  <div class="loading-plate" role="status">
    <span v-i18n>Loading…</span>
    <LoadingBar/>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import LoadingBar from '@/client/components/common/LoadingBar.vue';

// Waiting for content that takes a moment (statistics, card list): the page around it is already there
export default defineComponent({
  name: 'LoadingPlate',
  components: {LoadingBar},
});
</script>
