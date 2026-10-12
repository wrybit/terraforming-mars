<template>
  <!-- Admin login: the passphrase goes to the server once (POST), the browser then keeps a login cookie -->
  <form class="games-overview-card server-id-prompt" @submit.prevent="open">
    <p class="server-id-prompt-text" v-i18n>{{ wrong ? 'This server ID does not seem to fit. Please check it or enter it again.' : 'Enter the server ID to open the administration of this server.' }}</p>
    <p class="server-id-prompt-hint" v-i18n>It is the value of SERVER_ID in the .env file of the server.</p>
    <div class="server-settings-input server-id-prompt-row">
      <input v-model.trim="serverId" type="password" autocomplete="current-password" :aria-label="$t('Server ID')" :placeholder="$t('Server ID')">
      <button type="submit" class="btn btn-primary" :disabled="serverId === '' || busy" v-i18n>Open</button>
    </div>
  </form>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {logIn} from '@/client/components/admin/adminSession';

export default defineComponent({
  name: 'ServerIdPrompt',
  emits: ['opened'],
  data() {
    return {serverId: '', wrong: false, busy: false};
  },
  methods: {
    async open(): Promise<void> {
      this.busy = true;
      try {
        if (await logIn(this.serverId)) {
          this.$emit('opened');
          return;
        }
        this.wrong = true;
      } catch {
        this.wrong = true;
      } finally {
        this.busy = false;
      }
    },
  },
});
</script>
