<template>
  <!-- Erklärung oben in einer Tab-Box, wenn eine Karte die Eingabe auslöst (inputSourceCard.ts):
       die Karte selbst verkleinert, daneben ihr Name statt "Wähle eine Option", ihr Text und – falls
       sie mehr sagt als "Wähle eine Option" – die eigentliche Frage. Aufbau wie TabIntroBlock.vue. -->
  <div class="or-tab-intro card-intro">
    <SourceCardThumbnail :card="card"/>
    <div>
      <div class="or-tab-intro-title card-intro-name">{{ $t(card) }}</div>
      <div v-if="description !== undefined" class="or-tab-intro-hint">{{ $t(description) }}</div>
      <div v-if="!isGenericTitle(title)" class="card-intro-question">{{ $t(title) }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import {Message} from '@/common/logs/Message';
import {CardName} from '@/common/cards/CardName';
import SourceCardThumbnail from '@/client/components/SourceCardThumbnail.vue';
import {cardDescriptionText, isGenericTitle} from '@/client/components/inputSourceCard';

const props = defineProps<{
  card: CardName;
  title: string | Message;
}>();

const description = computed(() => cardDescriptionText(props.card));
</script>
