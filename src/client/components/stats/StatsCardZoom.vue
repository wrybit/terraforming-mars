<template>
  <!-- An body hängen, damit Kopfleiste und Filter-Sheet nicht darüber liegen -->
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

// Karten der Statistik groß: dieselbe Großansicht wie im Spiel, durch die Karten der Liste blätterbar
const props = defineProps<{
  names: ReadonlyArray<CardName>;
  index: number;
  // Position des angeklickten Elements: dort wächst die Karte heraus und schrumpft wieder hinein
  origin?: DOMRect;
}>();

defineEmits<{
  (event: 'close'): void;
}>();

const shown = ref(props.index);
</script>
