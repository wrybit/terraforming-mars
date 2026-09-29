<template>
  <!-- Auslösende Karte verkleinert oben in einer Tab-Box (or_options_tabs.less, .card-intro-card);
       gemeinsam genutzt von CardIntroBlock.vue und TabIntroBlock.vue -->
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
