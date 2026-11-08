<template>
  <!-- Head of the page "Push": the key figures as five boxes; a box without content (0) steps back -->
  <section class="games-overview-card push-overview">
    <div class="push-overview-head">
      <div>
        <h2 v-i18n>Push messages</h2>
        <p class="games-overview-note" v-i18n>Every message this server can send: when, to whom and with which link.</p>
      </div>
      <PushTestDelay />
    </div>
    <div class="push-facts">
      <div v-for="fact in facts" :key="fact.label" class="push-fact" :class="{'push-fact--empty': !fact.value}">
        <strong>{{ fact.value ?? '–' }}</strong>
        <span v-i18n>{{ fact.label }}</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import {AdminPushDelivery} from '@/common/admin/AdminPushModel';
import {PUSH_CATALOG} from './pushCatalog';
import PushTestDelay from './PushTestDelay.vue';

const props = defineProps<{
  subscribers: number | undefined,
  maxAgeDays: number | undefined,
  deliveries: ReadonlyArray<AdminPushDelivery> | undefined,
}>();

const countOf = (channel: string) => PUSH_CATALOG.filter((entry) => entry.channel === channel).length;

// undefined while loading, 0 when there is nothing: both shown faded
const facts = computed((): ReadonlyArray<{value: number | undefined, label: string}> => [
  {value: props.subscribers, label: 'subscribed browsers'},
  {value: props.deliveries?.filter((delivery) => delivery.result === 'sent').length, label: 'messages delivered lately'},
  {value: countOf('push'), label: 'events with push'},
  {value: countOf('browser'), label: 'browser notifications without push'},
  {value: props.maxAgeDays, label: 'days a subscription lives without a lobby visit'},
]);
</script>
