<template>
  <div id="admin-push" class="games-overview-container admin-home">
    <AdminGate active="push" @ready="load">
      <!-- Overview, every message (also the one without push), then what was sent lately -->
      <PushOverviewCard :subscribers="info?.subscribers" :maxAgeDays="info?.subscriptionMaxAgeDays" :deliveries="info?.deliveries" />
      <!-- Up to three messages next to each other, as far as the width allows -->
      <div class="push-events">
        <PushEventCard v-for="entry in PUSH_CATALOG" :key="entry.kind" :entry="entry" :icon="info?.icon ?? 'favicon.ico'" />
      </div>
      <p v-if="errorText !== ''" class="games-overview-note games-overview-note--error">{{ errorText }}</p>
      <PushDeliveriesCard v-else :deliveries="info?.deliveries ?? []" />
    </AdminGate>
  </div>
</template>

<script setup lang="ts">
import {ref} from 'vue';
import {paths} from '@/common/app/paths';
import {AdminPushInfo} from '@/common/admin/AdminPushModel';
import {describeFailure, failureOf, fetchOrFail} from '@/client/utils/requestFailure';
import AdminGate from '@/client/components/admin/AdminGate.vue';
import PushOverviewCard from '@/client/components/admin/push/PushOverviewCard.vue';
import PushEventCard from '@/client/components/admin/push/PushEventCard.vue';
import PushDeliveriesCard from '@/client/components/admin/push/PushDeliveriesCard.vue';
import {PUSH_CATALOG} from '@/client/components/admin/push/pushCatalog';

const info = ref<AdminPushInfo | undefined>(undefined);
const errorText = ref('');

async function load(): Promise<void> {
  try {
    info.value = await (await fetchOrFail(paths.API_ADMIN_PUSH)).json();
    errorText.value = '';
  } catch (error) {
    errorText.value = describeFailure(failureOf(error));
  }
}
</script>
