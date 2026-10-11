<template>
  <!-- Navigation of the admin area: on every admin page at the top, in words instead of endpoint paths -->
  <header class="games-overview-card admin-nav">
    <h1><HomeLink>{{ APP_NAME }}</HomeLink> — <span v-i18n>Administration</span></h1>
    <nav class="admin-nav-links">
      <a v-for="item in items" :key="item.page" :href="href(item.path)"
        class="admin-nav-link" :class="{'admin-nav-link--active': item.page === active}"
        :aria-current="item.page === active ? 'page' : undefined" v-i18n>{{ item.label }}</a>
      <!-- Raw data of the server (JSON, metrics): rarely needed, so folded away; opens in a new tab -->
      <details class="admin-nav-more">
        <summary class="admin-nav-link" v-i18n>Raw data</summary>
        <div class="admin-nav-menu">
          <a v-for="item in rawItems" :key="item.path" :href="href(item.path)" target="_blank" v-i18n>{{ item.label }}</a>
        </div>
      </details>
    </nav>
  </header>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {paths} from '@/common/app/paths';
import {APP_NAME} from '@/common/constants';
import HomeLink from '@/client/components/common/HomeLink.vue';
import {shortDocumentTitle} from '@/client/utils/documentTitle';
import {translateText} from '@/client/directives/i18n';

export type AdminPage = 'settings' | 'games' | 'load';

export default defineComponent({
  name: 'AdminNav',
  components: {HomeLink},
  props: {
    active: {type: String as PropType<AdminPage>, required: true},
  },
  data() {
    return {
      APP_NAME,
      items: [
        {page: 'settings', label: 'Settings', path: paths.ADMIN},
        {page: 'games', label: 'Games', path: paths.GAMES_OVERVIEW},
        {page: 'load', label: 'Load a game', path: paths.LOAD},
      ],
      rawItems: [
        {label: 'Statistics data', path: paths.API_STATS},
        {label: 'List of games', path: paths.API_GAMES},
        {label: 'Server metrics', path: paths.API_METRICS},
        {label: 'Visitor addresses', path: paths.API_IPS},
        {label: 'Memory snapshot (large download)', path: paths.API_HEAP_SNAPSHOT},
      ],
    };
  },
  computed: {
    serverId(): string {
      return new URLSearchParams(window.location.search).get('serverId') || '';
    },
  },
  mounted() {
    // Browser tab: "<page> · Admin | <short server title>", e.g. "Settings · Admin | TM"
    const page = this.items.find((item) => item.page === this.active);
    document.title = shortDocumentTitle([page === undefined ? undefined : translateText(page.label), 'Admin']);
  },
  methods: {
    href(path: string): string {
      return `${path}?serverId=${encodeURIComponent(this.serverId)}`;
    },
  },
});
</script>
