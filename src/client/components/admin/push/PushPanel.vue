<template>
  <!-- Content of the settings tab "Push": overview, every message (also the one without push), then what was sent lately -->
  <div id="admin-push" class="push-panel">
    <PushOverviewCard :loading="loading" :subscribers="info?.subscribers" :maxAgeDays="info?.subscriptionMaxAgeDays" :deliveries="info?.deliveries" />
    <!-- Up to three messages next to each other, as far as the width allows -->
    <div class="push-events">
      <PushEventCard v-for="entry in PUSH_CATALOG" :key="entry.kind" :entry="entry" :icon="info?.icon ?? 'favicon.ico'" />
    </div>
    <p v-if="errorText !== ''" class="games-overview-note games-overview-note--error">{{ errorText }}</p>
    <PushDeliveriesCard v-else :loading="loading" :deliveries="info?.deliveries ?? []" />
  </div>
</template>

<script setup lang="ts">
import {onMounted, ref} from 'vue';
import {paths} from '@/common/app/paths';
import {AdminPushInfo} from '@/common/admin/AdminPushModel';
import {describeFailure, failureOf, fetchOrFail} from '@/client/utils/requestFailure';
import PushOverviewCard from '@/client/components/admin/push/PushOverviewCard.vue';
import PushEventCard from '@/client/components/admin/push/PushEventCard.vue';
import PushDeliveriesCard from '@/client/components/admin/push/PushDeliveriesCard.vue';
import {PUSH_CATALOG} from '@/client/components/admin/push/pushCatalog';

const info = ref<AdminPushInfo | undefined>(undefined);
const errorText = ref('');
// Until the first answer (or its failure) the cards with server values show a spinner
const loading = ref(true);

async function load(): Promise<void> {
  try {
    info.value = await (await fetchOrFail(paths.API_ADMIN_PUSH)).json();
    errorText.value = '';
  } catch (error) {
    errorText.value = describeFailure(failureOf(error));
  }
  loading.value = false;
}

// The tab only exists after the admin login (AdminGate around the settings)
onMounted(() => void load());
</script>
