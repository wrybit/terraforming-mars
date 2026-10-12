<template>
  <!-- Head of the admin area (only after the login), built like the heads of the other pages (card list, create game):
       app menu, Mars logo back to the start page, page title; then the admin pages in words and the logout -->
  <header class="card-list-header card-list-header--plain admin-nav">
    <PageToolbar/>
    <PageTitle title="Administration"/>
    <nav class="admin-nav-links">
      <a v-for="item in items" :key="item.page" :href="item.path"
        class="admin-nav-link" :class="{'admin-nav-link--active': item.page === active}"
        :aria-current="item.page === active ? 'page' : undefined" v-i18n>{{ item.label }}</a>
    </nav>
    <button type="button" class="btn btn-sm btn-tone-quiet admin-nav-logout" @click="$emit('logout')" v-i18n>Log out</button>
  </header>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {paths} from '@/common/app/paths';
import PageToolbar from '@/client/components/PageToolbar.vue';
import PageTitle from '@/client/components/common/PageTitle.vue';
import {shortDocumentTitle} from '@/client/utils/documentTitle';
import {translateText} from '@/client/directives/i18n';

export type AdminPage = 'games' | 'settings' | 'raw';

export default defineComponent({
  name: 'AdminNav',
  components: {PageToolbar, PageTitle},
  props: {
    active: {type: String as PropType<AdminPage>, required: true},
  },
  emits: ['logout'],
  data() {
    return {
      items: [
        {page: 'games', label: 'Games', path: paths.GAMES_OVERVIEW},
        {page: 'settings', label: 'Settings', path: paths.ADMIN},
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
