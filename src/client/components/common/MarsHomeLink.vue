<template>
  <!-- Mars logo that leads back to the start screen in the same tab; one component for all page heads -->
  <a href="." class="page-title-home" aria-label="Terraforming Mars">
    <img :src="themedAsset('assets/stats/mars.png')" alt="" class="page-title-icon">
  </a>
</template>

<script setup lang="ts">
// The Dune theme shows Arrakis (src/themes/dune/graphics.json)
import {themedAsset} from '@/client/theme/themeDisplay';
</script>
