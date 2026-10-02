<template>
  <!-- One game of the admin overview: a fixed column per player name, winner with a trophy -->
  <tr class="games-overview-row" :class="{'games-overview-row--imported': summary.source === 'imported'}">
    <td class="games-overview-status">
      <span :class="summary.isFinished ? 'status-finished' : 'status-running'" :title="summary.isFinished ? 'Finished' : 'Running'"></span>
    </td>
    <td class="games-overview-game">
      <a v-if="summary.screenshotUrl !== undefined" :href="summary.screenshotUrl" target="_blank" class="games-overview-source" title="Saved screenshot of the result page">Screenshot</a>
      <!-- Target is the results page stored here: the external server deletes the game soon -->
      <a v-else-if="summary.importedParticipantId !== undefined" :href="importedResultUrl" target="_blank" class="games-overview-source" title="Result page saved on this server">imported</a>
      <span v-else class="games-overview-id">{{ summary.id }}</span>
      <span class="games-overview-date">{{ dateText }}</span>
    </td>
    <!-- 0 = unknown (e.g. screenshot without generation info) -->
    <td class="games-overview-generation">{{ summary.generation > 0 ? summary.generation : '–' }}</td>
    <td>
      <a v-if="summary.spectatorUrl !== undefined" :href="summary.spectatorUrl" target="_blank" class="games-overview-chip games-overview-chip--spectator">Watch</a>
    </td>
    <td v-for="name in columns" :key="name">
      <component :is="playerByName(name)?.url === undefined ? 'span' : 'a'"
        v-if="playerByName(name) !== undefined"
        :href="playerByName(name)?.url"
        target="_blank"
        class="games-overview-chip"
        :class="[playerColorClass(playerByName(name)!.color), {'games-overview-chip--winner': playerByName(name)!.isWinner}]"
        :title="chipTitle(playerByName(name)!)">
        <span v-if="playerByName(name)!.isWinner" class="games-overview-trophy">🏆</span>{{ playerByName(name)!.victoryPoints }}
      </component>
    </td>
    <td v-if="canDelete" class="games-overview-actions">
      <DeleteGameButton :isDeleting="isDeleting" @delete="$emit('delete', summary.id)"/>
    </td>
  </tr>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {AdminGameSummary, AdminPlayerSummary} from '@/common/admin/AdminGameSummary';
import {Color} from '@/common/Color';
import {playerColorClass} from '@/common/utils/utils';
import {paths} from '@/common/app/paths';
import DeleteGameButton from '@/client/components/admin/DeleteGameButton.vue';

export default defineComponent({
  name: 'GameOverview',
  components: {
    DeleteGameButton,
  },
  emits: ['delete'],
  props: {
    summary: {
      type: Object as () => AdminGameSummary,
      required: true,
    },
    columns: {
      type: Array as () => Array<string>,
      required: true,
    },
    isDeleting: {
      type: Boolean,
      default: false,
    },
    // Deleting is only available via the home network address (the overview decides, the server checks it again itself)
    canDelete: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    importedResultUrl(): string {
      return `${paths.THE_END}?id=${this.summary.importedParticipantId}`;
    },
    dateText(): string {
      return new Date(this.summary.createdTimeMs).toLocaleString(undefined, {dateStyle: 'short', timeStyle: 'short'});
    },
  },
  methods: {
    playerByName(name: string): AdminPlayerSummary | undefined {
      return this.summary.players.find((player) => player.name === name);
    },
    // Corporation and win in the tooltip: the tile itself stays compact (points only)
    chipTitle(player: AdminPlayerSummary): string {
      return [player.corporation, player.isWinner ? 'Winner' : undefined].filter((part) => part !== undefined).join(' · ');
    },
    playerColorClass(color: Color): string {
      return playerColorClass(color, 'bg_transparent');
    },
  },
});
</script>
