<template>
  <!-- Attach to body so the header bar and filter sheet don't sit above it -->
  <Teleport to="body">
    <MobileCardZoom class="stats-card-zoom" :count="names.length" v-model:index="shown" :origin="origin" @close="$emit('close')">
      <template #slide="{index: slide}">
        <Card :card="{name: names[slide]}"/>
      </template>
    </MobileCardZoom>
  </Teleport>
</template>

<script setup lang="ts">
import {ref} from 'vue';
import {CardName} from '@/common/cards/CardName';
import Card from '@/client/components/card/Card.vue';
import MobileCardZoom from '@/client/components/mobile/MobileCardZoom.vue';

// Statistics cards enlarged: the same large view as in the game, browsable through the cards of the list
const props = defineProps<{
  names: ReadonlyArray<CardName>;
  index: number;
  // Position of the clicked element: the card grows out of it and shrinks back into it
  origin?: DOMRect;
}>();

defineEmits<{
  (event: 'close'): void;
}>();

const shown = ref(props.index);
</script>
