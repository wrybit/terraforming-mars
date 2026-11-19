<template>
  <!-- A single card for embedded previews (AI hub: hover over card names). The hash names the card (#Card name);
       a new hash swaps the card without reloading the page. -->
  <div class="card-view">
    <Card v-if="model !== undefined" :card="model" />
  </div>
</template>

<script setup lang="ts">
import {computed, onBeforeUnmount, onMounted, ref} from 'vue';
import Card from '@/client/components/card/Card.vue';
import {CardName} from '@/common/cards/CardName';
import {CardModel} from '@/common/models/CardModel';
import {getCard} from '@/client/cards/ClientCardManifest';

const name = ref('');

// Name from the hash, also with a suffix ("Card name:SP") as in the decision logs
function readHash(): void {
  name.value = decodeURIComponent(window.location.hash.slice(1)).split(':')[0];
}

const model = computed<CardModel | undefined>(() => getCard(name.value as CardName) === undefined ? undefined : {name: name.value as CardName});

onMounted(() => {
  // Transparent page: the embedding page (AI hub) provides the background
  document.documentElement.classList.add('card-view-page');
  readHash();
  window.addEventListener('hashchange', readHash);
});
onBeforeUnmount(() => window.removeEventListener('hashchange', readHash));
</script>
