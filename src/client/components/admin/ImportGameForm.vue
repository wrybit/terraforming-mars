<template>
  <form class="games-overview-import" @submit.prevent="submit">
    <input v-model="url" type="text" class="games-overview-import-input" placeholder="Player ID (p…) or link from another server" :disabled="isImporting" required>
    <button type="submit" class="btn btn-primary" :disabled="isImporting || url.trim() === ''">{{ isImporting ? 'Importing…' : 'Import result' }}</button>
    <p v-if="message !== ''" class="games-overview-import-message" :class="{'games-overview-import-message--error': isError}">{{ message }}</p>
  </form>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {paths} from '@/common/app/paths';
import {AdminGameSummary, AdminImportGameRequest} from '@/common/admin/AdminGameSummary';

export default defineComponent({
  name: 'ImportGameForm',
  emits: ['imported'],
  props: {
    serverId: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      url: '',
      isImporting: false,
      message: '',
      isError: false,
    };
  },
  methods: {
    async submit() {
      this.isImporting = true;
      this.message = '';
      try {
        const body: AdminImportGameRequest = {url: this.url};
        const response = await fetch(`${paths.API_ADMIN_IMPORT_GAME}?serverId=${encodeURIComponent(this.serverId)}`, {method: 'POST', body: JSON.stringify(body)});
        if (!response.ok) {
          // Der Server liefert bei Fehlern einen lesbaren Grund (z. B. "already imported")
          throw new Error(await response.text());
        }
        const summary: AdminGameSummary = await response.json();
        this.url = '';
        this.isError = false;
        this.message = `Imported: ${summary.players.map((player) => player.name).join(', ')}`;
        this.$emit('imported', summary);
      } catch (error) {
        this.isError = true;
        this.message = error instanceof Error ? error.message : String(error);
      } finally {
        this.isImporting = false;
      }
    },
  },
});
</script>
