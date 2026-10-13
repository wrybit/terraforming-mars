<template>
  <!-- One game of the admin overview: eleven fixed columns (players 1–6, AI 1–5), chips with name and points,
       winner with a trophy -->
  <tr class="games-overview-row" :class="{'games-overview-row--imported': summary.source === 'imported'}">
    <td class="games-overview-status">
      <span :class="summary.isFinished ? 'status-finished' : 'status-running'" :title="$t(summary.isFinished ? 'Finished' : 'Running')"></span>
    </td>
    <td class="games-overview-game">
      <a v-if="summary.screenshotUrl !== undefined" :href="summary.screenshotUrl" target="_blank" class="games-overview-source" v-i18n :title="$t('Saved screenshot of the result page')">Screenshot</a>
      <!-- Target is the results page stored here: the external server deletes the game soon -->
      <a v-else-if="summary.importedParticipantId !== undefined" :href="importedResultUrl" target="_blank" class="games-overview-source" v-i18n :title="$t('Result page saved on this server')">Imported</a>
      <span v-else class="games-overview-id">{{ summary.id }}</span>
      <span class="games-overview-date">{{ dateText }}</span>
    </td>
    <!-- 0 = unknown (e.g. screenshot without generation info) -->
    <td class="games-overview-generation">{{ summary.generation > 0 ? summary.generation : '–' }}</td>
    <td>
      <!-- Finished: only the result is left to look at; running: watch as a spectator -->
      <a v-if="summary.isFinished && resultUrl !== undefined" :href="resultUrl" target="_blank" class="games-overview-chip games-overview-chip--spectator" v-i18n>Show</a>
      <a v-else-if="!summary.isFinished && summary.spectatorUrl !== undefined" :href="summary.spectatorUrl" target="_blank" class="games-overview-chip games-overview-chip--spectator" v-i18n>Watch</a>
    </td>
    <td v-for="(column, index) in columns" :key="index" class="games-overview-players">
      <component :is="player.url === undefined ? 'span' : 'a'"
        v-for="player in playersInColumn(summary, column)"
        :key="player.name"
        :href="player.url"
        target="_blank"
        class="games-overview-chip"
        :class="[playerColorClass(player.color), {'games-overview-chip--winner': player.isWinner, 'games-overview-chip--online': player.isOnline === true}]"
        :title="chipTitle(player)">
        <span class="games-overview-chip-name"><span class="games-overview-chip-own-name">{{ chipNameParts(player).name }}</span><span v-if="chipNameParts(player).marker !== undefined">{{ chipNameParts(player).marker }}</span></span>
        <strong><span v-if="player.isWinner" class="games-overview-trophy">🏆</span>{{ player.victoryPoints }}</strong>
      </component>
    </td>
    <td class="games-overview-actions">
      <DeleteGameButton :isDeleting="isDeleting" @delete="$emit('delete', summary.id)"/>
    </td>
  </tr>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {AdminGameSummary, AdminPlayerSummary} from '@/common/admin/AdminGameSummary';
import {chipNameParts, PlayerColumn, playersInColumn} from '@/client/components/admin/playerColumns';
import {Color} from '@/common/Color';
import {playerColorClass} from '@/common/utils/utils';
import {paths} from '@/common/app/paths';
import {translateText} from '@/client/directives/i18n';
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
      type: Array as () => ReadonlyArray<PlayerColumn>,
      required: true,
    },
    isDeleting: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    importedResultUrl(): string {
      return `${paths.THE_END}?id=${this.summary.importedParticipantId}`;
    },
    resultUrl(): string | undefined {
      return this.summary.resultUrl ?? this.summary.screenshotUrl ??
        (this.summary.importedParticipantId === undefined ? undefined : this.importedResultUrl);
    },
    dateText(): string {
      return new Date(this.summary.createdTimeMs).toLocaleString(undefined, {dateStyle: 'short', timeStyle: 'short'});
    },
  },
  methods: {
    playersInColumn,
    chipNameParts,
    // Corporation and win in the tooltip: the tile itself stays compact (points only)
    chipTitle(player: AdminPlayerSummary): string {
      return [player.corporation, player.isWinner ? translateText('Winner') : undefined, player.isOnline === true ? translateText('Online') : undefined].filter((part) => part !== undefined).join(' · ');
    },
    playerColorClass(color: Color): string {
      return playerColorClass(color, 'bg_transparent');
    },
  },
});
</script>
