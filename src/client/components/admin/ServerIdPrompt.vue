<template>
  <!-- Admin login: the passphrase goes to the server once (POST), the browser then keeps a login cookie.
       Three groups with more space between than within: who, what to enter, the field with its button -->
  <form class="games-overview-card admin-login-card" @submit.prevent="open">
    <div class="admin-login-title">
      <h1>{{ APP_NAME }}</h1>
      <span v-i18n>Administration</span>
    </div>
    <div class="admin-login-explanation">
      <p class="admin-login-text" :class="{'admin-login-text--error': wrong}" v-i18n>{{ wrong ? 'This server ID does not seem to fit. Please check it or enter it again.' : 'Enter the server ID to open the administration of this server.' }}</p>
      <p class="admin-login-hint" v-i18n>It is the value of SERVER_ID in the .env file of the server.</p>
    </div>
    <div class="admin-login-fields">
      <input v-model.trim="serverId" class="admin-login-input" type="password" autocomplete="current-password" autofocus :aria-label="$t('Server ID')" :placeholder="$t('Server ID')">
      <button type="submit" class="btn btn-primary admin-login-button" :disabled="serverId === '' || busy" v-i18n>Open</button>
    </div>
  </form>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {logIn} from '@/client/components/admin/adminSession';
import {APP_NAME} from '@/common/constants';

export default defineComponent({
  name: 'ServerIdPrompt',
  emits: ['opened'],
  data() {
    return {APP_NAME, serverId: '', wrong: false, busy: false};
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
