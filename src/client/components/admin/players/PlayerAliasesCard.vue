<template>
  <!-- Saved merges: each one can be undone; the old name then counts on its own again -->
  <section class="games-overview-card admin-players-aliases">
    <h2 v-i18n>Merged</h2>
    <p class="games-overview-note" v-i18n>Applies permanently, also to new games under the old name.</p>
    <ul v-if="aliases.length > 0" class="admin-players-alias-list">
      <li v-for="alias in aliases" :key="alias.from" class="admin-players-alias">
        <span class="admin-players-pair">
          <s class="admin-players-pill">{{ alias.from }}</s>
          <span class="admin-players-arrow" aria-hidden="true">→</span>
          <strong>{{ alias.to }}</strong>
        </span>
        <span class="admin-players-alias-date">{{ formatDate(alias.createdTimeMs) }}</span>
        <button type="button" class="btn btn-sm btn-tone-quiet" :disabled="busy" @click="emit('unmerge', alias.from)" v-i18n>Unmerge</button>
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
  (event: 'unmerge', from: string): void;
}>();

</script>
