<template>
  <!-- Navigation of the admin area: on every admin page at the top, in words instead of endpoint paths -->
  <header class="games-overview-card admin-nav">
    <h1><HomeLink>{{ APP_NAME }}</HomeLink> — <span v-i18n>Administration</span></h1>
    <nav v-if="loggedIn" class="admin-nav-links">
      <a v-for="item in items" :key="item.page" :href="item.path"
        class="admin-nav-link" :class="{'admin-nav-link--active': item.page === active}"
        :aria-current="item.page === active ? 'page' : undefined" v-i18n>{{ item.label }}</a>
    </nav>
    <button v-if="loggedIn" type="button" class="btn btn-sm btn-tone-quiet admin-nav-logout" @click="$emit('logout')" v-i18n>Log out</button>
  </header>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {paths} from '@/common/app/paths';
import {APP_NAME} from '@/common/constants';
import HomeLink from '@/client/components/common/HomeLink.vue';
import {shortDocumentTitle} from '@/client/utils/documentTitle';
import {translateText} from '@/client/directives/i18n';

export type AdminPage = 'settings' | 'games' | 'load' | 'raw';

export default defineComponent({
  name: 'AdminNav',
  components: {HomeLink},
  props: {
    active: {type: String as PropType<AdminPage>, required: true},
    loggedIn: {type: Boolean, default: false},
  },
  emits: ['logout'],
  data() {
    return {
      APP_NAME,
      items: [
        {page: 'settings', label: 'Settings', path: paths.ADMIN},
        {page: 'games', label: 'Games', path: paths.GAMES_OVERVIEW},
        {page: 'load', label: 'Load a game', path: paths.LOAD},
        {page: 'raw', label: 'Raw data', path: paths.ADMIN_RAW},
      ],
    };
  },
  mounted() {
    // Browser tab: "<page> · Admin | <short server title>", e.g. "Settings · Admin | TM"
    const page = this.items.find((item) => item.page === this.active);
    document.title = shortDocumentTitle([page === undefined ? undefined : translateText(page.label), 'Admin']);
  },
});
</script>
