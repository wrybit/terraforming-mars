<template>
  <!-- Intro at the top of a tab box when a card triggers the input (inputSourceCard.ts):
       the card itself scaled down, next to it its name instead of "Select an option", its text and – if
       it says more than "Select an option" – the actual question. Structure like TabIntroBlock.vue. -->
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
