<template>
  <!-- Page title of the pages outside the game (card list, statistics): Mars logo + app name + page name.
       The logo always leads back to the start screen in the same tab; on narrow screens the app name is hidden. -->
  <h1 class="page-title">
    <MarsHomeLink/>
    <a v-if="titleHref !== undefined" :href="titleHref" data-page-title-link class="page-title-text">
      <span class="page-title-app">{{ appName }} – </span><span>{{ $t(title) }}</span>
    </a>
    <span v-else class="page-title-text">
      <span class="page-title-app">{{ appName }} – </span><span>{{ $t(title) }}</span>
    </span>
  </h1>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import MarsHomeLink from '@/client/components/common/MarsHomeLink.vue';
import {activeTheme} from '@/client/theme/applyTheme';
import {translateText} from '@/client/directives/i18n';

export default defineComponent({
  name: 'PageTitle',
  components: {MarsHomeLink},
  computed: {
    // Mars keeps the English name in every language; the Dune theme names its game ("Terraforming Dune")
    appName(): string {
      return activeTheme() === 'mars' ? 'Terraforming Mars' : translateText('Terraforming Mars');
    },
  },
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
