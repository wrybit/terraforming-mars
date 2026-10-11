<!-- App background (Milky Way panorama by ESO) behind start page, game views, results, card list and stats.
     A <picture> instead of a CSS background, because only srcset lets the browser pick the file that fits
     the window and pixel density; the variants come from scripts/make-backgrounds.py.
     The credit is required by the licence (CC BY 4.0). It sits at the top right of the page, not of the
     window, so it scrolls away instead of covering content. -->
<template>
  <div class="app-background" :class="{'app-background--always': always}" aria-hidden="true">
    <picture class="app-background__picture">
      <source
        v-for="source in sources"
        :key="source.type + source.media"
        :media="source.media"
        :type="source.type"
        :srcset="source.srcset"
        :sizes="source.sizes"
      >
      <img class="app-background__image" :src="fallback" alt="" decoding="async" fetchpriority="high">
    </picture>
  </div>
  <a v-if="showCredit" class="app-background-credit" :class="{'app-background-credit--always': always}" :href="credit.url" target="_blank" rel="noopener"><span class="app-background-credit__text"><template v-for="(part, index) in credit.parts" :key="part"><span class="app-background-credit__part">{{ $t(part) }}</span><template v-if="index < credit.parts.length - 1"> · </template></template></span></a>
</template>

<script setup lang="ts">
import {BACKGROUND_CREDIT, backgroundFallback, backgroundSources} from '@/client/components/appBackground';

defineProps<{
  // Start page: shows the image even with the setting "Remove background image"
  always?: boolean,
  // Off where the page has its own controls in the top right corner (App.vue decides)
  showCredit?: boolean,
}>();

const sources = backgroundSources();
const fallback = backgroundFallback();
const credit = BACKGROUND_CREDIT;
</script>
