<template>
  <!-- Attach to body: inside the log (own stacking context) the modal would otherwise sit below header and footer bars -->
  <Teleport to="body">
    <MobileCardZoom :count="items.length" v-model:index="index" @close="$emit('close')">
      <template #slide="{index: slide}">
        <Card v-if="items[slide].kind === 'card'" :card="cardModel(items[slide].name as CardName)"/>
        <GlobalEvent v-else-if="items[slide].kind === 'globalEvent'" :globalEventName="items[slide].name as GlobalEventName" type="prior" :showIcons="false"/>
        <Colony v-else :colony="simpleColonyModel(items[slide].name as ColonyName)"/>
      </template>
    </MobileCardZoom>
  </Teleport>
</template>

<script setup lang="ts">
import {computed, ref} from 'vue';
import {LogMessage} from '@/common/logs/LogMessage';
import {CardName} from '@/common/cards/CardName';
import {ColonyName} from '@/common/colonies/ColonyName';
import {GlobalEventName} from '@/common/turmoil/globalEvents/GlobalEventName';
import {simpleColonyModel} from '@/common/models/ColonyModel';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import Card from '@/client/components/card/Card.vue';
import GlobalEvent from '@/client/components/turmoil/GlobalEvent.vue';
import Colony from '@/client/components/colonies/Colony.vue';
import MobileCardZoom from '@/client/components/mobile/MobileCardZoom.vue';
import {logCardModel} from '@/client/components/logpanel/logCardModel';
import {logMessageCards, logMessageColonies, logMessageGlobalEvents} from '@/client/components/logpanel/logMessageContent';

// Mobile view: cards, global events and colonies of a log line as a carousel in the modal

const props = defineProps<{
  message: LogMessage;
  players: ReadonlyArray<PublicPlayerModel>;
}>();

defineEmits<{
  (event: 'close'): void;
}>();

type LogItem = {kind: 'card' | 'globalEvent' | 'colony', name: string};

// Order as in the block below the log: cards, then events, then colonies
const items = computed<Array<LogItem>>(() => [
  ...logMessageCards(props.message).map((name) => ({kind: 'card' as const, name})),
  ...logMessageGlobalEvents(props.message).map((name) => ({kind: 'globalEvent' as const, name})),
  ...logMessageColonies(props.message).map((name) => ({kind: 'colony' as const, name})),
]);

const index = ref(0);

function cardModel(name: CardName) {
  return logCardModel(name, props.players);
}
</script>
