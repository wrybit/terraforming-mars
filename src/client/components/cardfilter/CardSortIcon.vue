<template>
  <!-- Icon per sorting: also tells on the narrow phone button what the list is sorted by -->
  <svg v-if="sortKey === 'manual'" class="card-sort-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <circle cx="9" cy="6" r="1.7"/><circle cx="15" cy="6" r="1.7"/><circle cx="9" cy="12" r="1.7"/>
    <circle cx="15" cy="12" r="1.7"/><circle cx="9" cy="18" r="1.7"/><circle cx="15" cy="18" r="1.7"/>
  </svg>
  <i v-else-if="sortKey === 'cost'" class="card-sort-icon resource_icon resource_icon--megacredits" aria-hidden="true"></i>
  <span v-else-if="sortKey === 'type'" class="card-sort-icon card-sort-icon--types" aria-hidden="true">
    <i class="background-color-active"></i><i class="background-color-automated"></i><i class="background-color-events"></i>
  </span>
  <span v-else-if="sortKey === 'resource'" class="card-sort-icon card-resource card-resource-microbe" aria-hidden="true"></span>
  <span v-else class="card-sort-icon card-filter-vp" aria-hidden="true" v-i18n>VP</span>
</template>

<script setup lang="ts">
import {SortKey} from '@/client/utils/SortOrder';

defineProps<{
  sortKey: SortKey | 'manual';
}>();
</script>
