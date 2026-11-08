<template>
  <!-- Head of the page "Push": how many browsers can be reached, then the way of a message from event to click -->
  <section class="games-overview-card push-overview">
    <h2 v-i18n>Push messages</h2>
    <p class="games-overview-note" v-i18n>Every message this server can send: when, to whom and with which link.</p>
    <div class="push-facts">
      <div class="push-fact"><strong>{{ subscribers ?? '–' }}</strong><span v-i18n>subscribed browsers</span></div>
      <div class="push-fact"><strong>{{ pushEventCount }}</strong><span v-i18n>events with push</span></div>
      <div class="push-fact"><strong>{{ maxAgeDays ?? '–' }}</strong><span v-i18n>days a subscription lives without a lobby visit</span></div>
    </div>
    <ol class="push-flow">
      <li v-for="(step, index) in steps" :key="step.title" class="push-flow-step">
        <strong>{{ index + 1 }} · <span v-i18n>{{ step.title }}</span></strong>
        <span v-i18n>{{ step.text }}</span>
      </li>
    </ol>
  </section>
</template>

<script setup lang="ts">
import {PUSH_CATALOG} from './pushCatalog';

defineProps<{
  subscribers: number | undefined,
  maxAgeDays: number | undefined,
}>();

const pushEventCount = PUSH_CATALOG.filter((entry) => entry.channel === 'push').length;

// The way of one message (server/lobby/LobbyPush.ts, client/sw.ts)
const steps: ReadonlyArray<{title: string, text: string}> = [
  {title: 'Event', text: 'Join, request or start in the lobby'},
  {title: 'Reachable?', text: 'Subscription of that browser, renewed on every lobby visit'},
  {title: 'Push service', text: 'Kept 30 min, high urgency, one per room'},
  {title: 'Service worker', text: 'Shown only if no lobby tab is in front'},
  {title: 'Tap or click', text: 'Opens the room in the lobby tab or a new tab'},
];
</script>
