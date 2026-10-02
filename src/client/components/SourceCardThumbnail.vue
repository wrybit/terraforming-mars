<template>
  <!-- Triggering card, scaled down at the top of a tab box (or_options_tabs.less, .card-intro-card);
       shared by CardIntroBlock.vue and TabIntroBlock.vue -->
  <div class="card-intro-card">
    <Card :card="{name: card}"/>
  </div>
</template>

<script setup lang="ts">
import {CardName} from '@/common/cards/CardName';
import Card from '@/client/components/card/Card.vue';

defineProps<{
  card: CardName;
}>();
</script>
