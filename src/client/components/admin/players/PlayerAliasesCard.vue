<template>
  <!-- Saved merges: each one can be undone; the old name then counts on its own again -->
  <section class="games-overview-card admin-players-aliases">
    <h2 v-i18n>Merged</h2>
    <p class="games-overview-note" v-i18n>Permanent merges also apply to new games under the old name; one-time merges only to the games so far.</p>
    <ul v-if="aliases.length > 0" class="admin-players-alias-list">
      <li v-for="alias in aliases" :key="alias.id" class="admin-players-alias">
        <span class="admin-players-pair">
          <s class="admin-players-pill">{{ alias.from }}</s>
          <span class="admin-players-arrow" aria-hidden="true">→</span>
          <strong>{{ alias.to }}</strong>
        </span>
        <span class="admin-players-alias-date">
          {{ formatDate(alias.createdTimeMs) }} ·
          <span v-if="alias.gameIds === undefined" v-i18n>permanent</span>
          <span v-else v-i18n="[String(alias.gameIds.length)]">${0} games, one-time</span>
        </span>
        <button type="button" class="btn btn-sm btn-tone-quiet" :disabled="busy" @click="emit('unmerge', alias.id)" v-i18n>Unmerge</button>
      </li>
    </ul>
    <p v-else class="games-overview-note" v-i18n>Nothing merged yet.</p>
  </section>
</template>

<script setup lang="ts">
import {PlayerAlias} from '@/common/admin/PlayerAliases';
import {formatDate} from '@/client/components/stats/statsLabels';

defineProps<{
  aliases: ReadonlyArray<PlayerAlias>,
  busy: boolean,
}>();

const emit = defineEmits<{
  (event: 'unmerge', id: string): void;
}>();

</script>
