<template>
  <div id="games-overview" class="games-overview-container admin-home">
    <section class="games-overview-card">
      <h1><HomeLink>{{ APP_NAME }}</HomeLink> — <span v-i18n>Admin</span></h1>
      <ul class="admin-home-links">
        <li v-for="path of paths" :key="path">
          <a :href="path + '?serverId=' + serverId">{{path}}</a>
        </li>
      </ul>
    </section>
    <!-- Settings of the .env file, changeable here (serverSettings.ts) -->
    <h2 class="admin-home-heading" v-i18n>Server settings</h2>
    <ServerSettingsPanel :serverId="serverId"/>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {paths} from '@/common/app/paths';
import {APP_NAME} from '@/common/constants';
import HomeLink from '@/client/components/common/HomeLink.vue';
import ServerSettingsPanel from '@/client/components/admin/ServerSettingsPanel.vue';

export default defineComponent({
  name: 'AdminHome',
  components: {
    HomeLink,
    ServerSettingsPanel,
  },
  data() {
    return {
      APP_NAME,
      paths: [
        paths.API_STATS,
        paths.GAMES_OVERVIEW,
        paths.API_GAMES,
        paths.API_METRICS,
        paths.LOAD,
        paths.API_IPS,
        paths.API_HEAP_SNAPSHOT,
      ],
    };
  },
  computed: {
    serverId(): string {
      return new URLSearchParams(window.location.search).get('serverId') || '';
    },
  },
});
</script>
