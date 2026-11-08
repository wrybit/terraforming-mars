<template>
  <!-- The latest messages the server tried to send (server/lobby/LobbyPush.ts keeps them), newest first -->
  <section class="games-overview-card push-deliveries">
    <h2 v-i18n>Recent deliveries</h2>
    <p v-if="deliveries.length === 0" class="games-overview-note" v-i18n>No messages sent yet.</p>
    <div v-else class="games-overview-scroll">
      <table class="push-deliveries-table">
        <thead>
          <tr><th v-i18n>Time</th><th v-i18n>Event</th><th v-i18n>Room</th><th v-i18n>To</th><th v-i18n>Result</th></tr>
        </thead>
        <tbody>
          <tr v-for="(delivery, index) in deliveries" :key="index">
            <td>{{ shortDateTime(delivery.at) }}</td>
            <td><code class="push-kind">{{ delivery.kind }}</code></td>
            <td>{{ delivery.roomTitle }}</td>
            <td><code>{{ delivery.participant }}…</code></td>
            <td :class="'push-result--' + delivery.result" v-i18n>{{ RESULT_LABELS[delivery.result] }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup lang="ts">
import {AdminPushDelivery} from '@/common/admin/AdminPushModel';
import {LobbyPushResult} from '@/common/lobby/LobbyPushModel';
import {shortDateTime} from '@/client/utils/shortDateTime';

defineProps<{deliveries: ReadonlyArray<AdminPushDelivery>}>();

const RESULT_LABELS: Record<LobbyPushResult, string> = {
  sent: 'sent',
  unreachable: 'not subscribed',
  gone: 'subscription gone',
};
</script>
