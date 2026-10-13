<template>
  <!-- Label and value per row: the label dim on the left, the value on the right (scanned like a spec sheet) -->
  <dl class="dashboard-facts">
    <template v-for="fact in facts" :key="fact.label">
      <dt v-i18n>{{ fact.label }}</dt>
      <dd :class="fact.tone === undefined ? undefined : 'dashboard-tone--' + fact.tone" :title="fact.title">{{ fact.value }}</dd>
    </template>
  </dl>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {DashboardFact} from '@/client/components/admin/dashboard/dashboardTypes';

export default defineComponent({
  name: 'DashboardFacts',
  props: {
    facts: {type: Array as PropType<ReadonlyArray<DashboardFact>>, required: true},
  },
});
</script>
