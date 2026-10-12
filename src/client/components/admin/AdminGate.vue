<template>
  <!-- Every admin page: navigation on top, the page itself only after the admin login (adminSession.ts) -->
  <AdminNav :active="active" :loggedIn="state === 'admin'" @logout="logout"/>
  <p v-if="state === 'loading'" class="games-overview-card games-overview-note" v-i18n>Loading…</p>
  <ServerIdPrompt v-else-if="state === 'guest'" @opened="open"/>
  <div v-else-if="state === 'unreachable'" class="games-overview-card server-id-prompt">
    <p class="server-id-prompt-text" v-i18n>The server is not answering right now – probably it is just restarting.</p>
    <div><button type="button" class="btn btn-tone-quiet" @click="check" v-i18n>Try again</button></div>
  </div>
  <slot v-else></slot>
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
