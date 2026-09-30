<template>
  <div class="mb-card-zoom" role="dialog" aria-modal="true">
    <!-- Karte groß in der Mitte, Hintergrund unscharf (wie im Mockup); darunter kompakte Knöpfe -->
    <button type="button" class="mb-card-zoom-backdrop" :aria-label="$t('Close')" @click="$emit('close')"></button>
    <div class="mb-card-zoom-card mb-fit-off">
      <Card :card="card"/>
    </div>
    <div class="mb-card-zoom-actions">
      <AppButton v-if="playable" :title="$t('Play card')" type="submit" @click="$emit('play')"/>
      <button type="button" class="mb-taskbar-back" @click="$emit('close')">{{ $t('Close') }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import {CardModel} from '@/common/models/CardModel';
import Card from '@/client/components/card/Card.vue';
import AppButton from '@/client/components/common/AppButton.vue';

defineProps<{
  card: CardModel;
  // Karte ist jetzt spielbar: Knopf "Karte spielen" (öffnet das Karussell mit dieser Karte)
  playable: boolean;
}>();

defineEmits<{
  (event: 'close'): void;
  (event: 'play'): void;
}>();
</script>
