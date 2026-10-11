<template>
  <!-- Admin page without (a matching) serverId: ask for it right here instead of only reporting a failure -->
  <form class="games-overview-card server-id-prompt" @submit.prevent="open">
    <p class="server-id-prompt-text" v-i18n>{{ wrong ? 'This server ID does not seem to fit. Please check it or enter it again.' : 'Enter the server ID to see and change the settings of this server.' }}</p>
    <p class="server-id-prompt-hint" v-i18n>It is the value of SERVER_ID in the .env file of the server.</p>
    <div class="server-settings-input server-id-prompt-row">
      <input v-model.trim="serverId" type="password" autocomplete="off" :aria-label="$t('Server ID')" :placeholder="$t('Server ID')">
      <button type="submit" class="btn btn-primary" :disabled="serverId === ''" v-i18n>Open</button>
    </div>
  </form>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {paths} from '@/common/app/paths';

export default defineComponent({
  name: 'ServerIdPrompt',
  props: {
    // An ID was given but the server refused it
    wrong: {type: Boolean, default: false},
  },
  data() {
    return {serverId: ''};
  },
  methods: {
    open(): void {
      window.location.href = `${paths.ADMIN}?serverId=${encodeURIComponent(this.serverId)}`;
    },
  },
});
</script>
