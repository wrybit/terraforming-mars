<template>
  <!-- Every admin page: navigation on top, the page itself only after the admin login (adminSession.ts) -->
  <template v-if="state === 'admin'">
    <AdminNav :active="active" @logout="logout"/>
    <slot></slot>
  </template>
  <!-- Not logged in: only the login, alone in the middle of the screen like a real login page -->
  <div v-else class="admin-login">
    <p v-if="state === 'loading'" class="games-overview-note" v-i18n>Loading…</p>
    <ServerIdPrompt v-else-if="state === 'guest'" @opened="open"/>
    <div v-else class="games-overview-card admin-login-card">
      <p class="admin-login-text" v-i18n>The server is not answering right now – probably it is just restarting.</p>
      <button type="button" class="btn btn-tone-quiet admin-login-button" @click="check" v-i18n>Try again</button>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import AdminNav, {AdminPage} from '@/client/components/admin/AdminNav.vue';
import ServerIdPrompt from '@/client/components/admin/ServerIdPrompt.vue';
import {AdminLoginState, checkAdminLogin, logOut} from '@/client/components/admin/adminSession';

type DataModel = {
  state: AdminLoginState | 'loading',
};

export default defineComponent({
  name: 'AdminGate',
  components: {AdminNav, ServerIdPrompt},
  props: {
    active: {type: String as PropType<AdminPage>, required: true},
  },
  // 'ready': logged in, the page may load its data now
  emits: ['ready'],
  data(): DataModel {
    return {state: 'loading'};
  },
  mounted() {
    void this.check();
  },
  methods: {
    async check(): Promise<void> {
      this.state = 'loading';
      this.state = await checkAdminLogin();
      if (this.state === 'admin') {
        this.$emit('ready');
      }
    },
    open(): void {
      this.state = 'admin';
      this.$emit('ready');
    },
    async logout(): Promise<void> {
      await logOut();
      this.state = 'guest';
    },
  },
});
</script>
