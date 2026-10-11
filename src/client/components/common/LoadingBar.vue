<template>
  <div class="loading-bar" role="progressbar" :aria-label="$t('Loading…')"></div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';

// Loading without a known progress: the thin bar of the start page preloader with a running segment (start_preloader.less)
export default defineComponent({
  name: 'LoadingBar',
});
</script>
