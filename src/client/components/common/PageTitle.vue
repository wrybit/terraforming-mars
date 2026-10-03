<template>
  <!-- Page title of the pages outside the game (card list, statistics): Mars logo + app name + page name.
       The logo always leads back to the start screen in the same tab; on narrow screens the app name is hidden. -->
  <h1 class="page-title">
    <a href="." class="page-title-home" aria-label="Terraforming Mars">
      <img src="assets/stats/mars.png" alt="" class="page-title-icon">
    </a>
    <a v-if="titleHref !== undefined" :href="titleHref" data-page-title-link class="page-title-text">
      <span class="page-title-app">Terraforming Mars – </span><span>{{ $t(title) }}</span>
    </a>
    <span v-else class="page-title-text">
      <span class="page-title-app">Terraforming Mars – </span><span>{{ $t(title) }}</span>
    </span>
  </h1>
</template>

<script lang="ts">
import {defineComponent} from 'vue';

export default defineComponent({
  name: 'PageTitle',
  props: {
    // Page name as an i18n key, e.g. 'Statistics'
    title: {
      type: String,
      required: true,
    },
    // Optional target of the page name (statistics: back to its overview)
    titleHref: {
      type: String,
      required: false,
      default: undefined,
    },
  },
});
</script>
