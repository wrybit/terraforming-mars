<template>
  <!-- One global event in the Turmoil tab like the game card: slot and name, the effect as icons on a white field,
       the description small below, at the bottom the card's two neutral delegates (when revealed / when it starts).
       Sizes grow with the card width (turmoil_board_tab.less, cqi). -->
  <article :class="['turmoil-event', 'turmoil-event--' + type]" :data-test="'turmoil-event-' + type">
    <div class="turmoil-event__slot"><b>{{ $t('Gen') }} {{ generation }}</b> · {{ $t(label) }}</div>
    <div class="turmoil-event__name">{{ $t(event.name) }}</div>
    <!-- card-container: the card icon styles (cards_v2.less) only apply inside it -->
    <div class="turmoil-event__effect card-container">
      <div class="card-content turmoil-event__render"><CardRenderData :renderData="event.renderData"/></div>
    </div>
    <div class="turmoil-event__text"><CardDescription :item="event.description"/></div>
    <div class="turmoil-event__neutral">
      <span class="turmoil-event__step turmoil-event__step--done" :title="$t('when revealed')">
        <img class="turmoil-event__figure" :src="figureImage('neutral')" alt=""><i>→</i>
        <img class="turmoil-event__party" :src="partyImage(event.revealedDelegate)" :alt="$t(event.revealedDelegate)">
        <small>✓ {{ $t('when revealed') }}</small>
      </span>
      <span :class="['turmoil-event__step', {'turmoil-event__step--done': type === 'current'}]" :title="$t('when it starts')">
        <img class="turmoil-event__figure" :src="figureImage('neutral')" alt=""><i>→</i>
        <img class="turmoil-event__party" :src="partyImage(event.currentDelegate)" :alt="$t(event.currentDelegate)">
        <small><template v-if="type === 'current'">✓ </template>{{ $t('when it starts') }}</small>
      </span>
    </div>
  </article>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import CardRenderData from '@/client/components/card/CardRenderData.vue';
import CardDescription from '@/client/components/card/CardDescription.vue';
import {GlobalEventName} from '@/common/turmoil/globalEvents/GlobalEventName';
import {ClientGlobalEvent} from '@/common/turmoil/ClientGlobalEvent';
import {getGlobalEvent} from '@/client/turmoil/ClientGlobalEventManifest';
import {figureImage, partyImage} from './turmoilView';

const props = defineProps<{
  name: GlobalEventName;
  type: 'current' | 'coming' | 'distant';
  generation: number;
  label: string;
}>();

const event = computed((): ClientGlobalEvent => {
  const found = getGlobalEvent(props.name);
  if (found === undefined) {
    throw new Error('Unknown global event ' + props.name);
  }
  return found;
});
</script>
