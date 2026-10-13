<template>
  <!-- Players online now: large with a blinking green light while someone plays, small and quiet at zero -->
  <div class="dashboard-online" :class="{'dashboard-online--active': count > 0}">
    <span class="dashboard-online-label">
      <span v-if="count > 0" class="online-players-light" aria-hidden="true"></span>
      <span v-i18n>Players online now</span>
    </span>
    <span class="dashboard-online-count">{{ count }}</span>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';

export default defineComponent({
  name: 'DashboardOnlineCount',
  props: {
    count: {type: Number, required: true},
  },
});
</script>
