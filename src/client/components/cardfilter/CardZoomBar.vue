<template>
  <!-- Header row of card and tile lists without filter or sorting (standard projects, milestones, awards, buying …):
       the same row as CardFilterBar, so the zoom sits in the same place in every tab of the action box.
       Not in the mobile view: cards and tiles are fitted to the screen there (CardFilterBar does the same). -->
  <div v-if="!isMobile" class="card-filter-bar card-filter-bar--zoom-only">
    <slot name="lead"></slot>
    <CardZoomSlider/>
  </div>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import CardZoomSlider from '@/client/components/cardfilter/CardZoomSlider.vue';
import {mobileLayout} from '@/client/utils/mobileLayout';

const isMobile = computed(() => mobileLayout.value);
</script>
