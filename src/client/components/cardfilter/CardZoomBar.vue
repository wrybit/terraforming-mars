<template>
  <!-- Top row of card lists without filter and sorting (standard projects, buying, awards): the same row as
       CardFilterBar (card_filter_bar.less) with an optional lead on the left and the card size on the right -->
  <div class="card-filter-bar card-zoom-bar">
    <slot name="lead"></slot>
    <CardZoomSlider/>
  </div>
</template>

<script setup lang="ts">
import CardZoomSlider from '@/client/components/cardfilter/CardZoomSlider.vue';
</script>
