<template>
  <!-- One game of the admin overview: theme, then eleven fixed columns (players 1–6, AI 1–5), chips with name and points,
       winner with a trophy -->
  <tr class="games-overview-row" :class="{'games-overview-row--imported': summary.source === 'imported'}">
    <!-- Mars or Dune at a glance (same badge as in the lobby list) -->
    <td class="games-overview-theme"><ThemePlanetBadge :theme="summary.theme" /></td>
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
    <!-- Time since the last human move, exact time in the tooltip; imports have none -->
    <td class="games-overview-activity" :title="activityTitle">{{ activityText }}</td>
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
        <span class="games-overview-chip-name"><LanguageFlag v-if="player.language !== undefined" :lang="player.language" class="language-flag--round" /><span class="games-overview-chip-own-name">{{ chipNameParts(player).name }}</span><span v-if="chipNameParts(player).marker !== undefined">{{ chipNameParts(player).marker }}</span></span>
        <strong><span v-if="player.isWinner" class="games-overview-trophy">🏆</span>{{ player.victoryPoints }} <span class="games-overview-chip-unit" v-i18n>VP</span></strong>
      </component>
    </td>
    <td class="games-overview-actions">
      <DeleteGameButton :isDeleting="isDeleting" @delete="$emit('delete', summary.id)" />
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
import {LANGUAGES} from '@/common/constants';
import {translateText} from '@/client/directives/i18n';
import DeleteGameButton from '@/client/components/admin/DeleteGameButton.vue';
import LanguageFlag from '@/client/components/LanguageFlag.vue';
import ThemePlanetBadge from '@/client/components/common/ThemePlanetBadge.vue';
import {relativeTimeText} from '@/client/utils/relativeTime';
import {gameLocaleToIntlLocale} from '@/client/utils/LocaleUtils';
import {getPreferences} from '@/client/utils/PreferencesManager';
import {shortDateTime} from '@/client/utils/shortDateTime';

export default defineComponent({
  name: 'GameOverview',
  components: {
    DeleteGameButton,
    LanguageFlag,
    ThemePlanetBadge,
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
    // Passed in by the table, which advances it every minute: the relative times stay current
    nowMs: {
      type: Number,
      default: () => Date.now(),
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
      return shortDateTime(this.summary.createdTimeMs);
    },
    activityText(): string {
      const timeMs = this.summary.lastActivityTimeMs;
      return timeMs === undefined ? '–' : relativeTimeText(timeMs, this.nowMs, gameLocaleToIntlLocale(getPreferences().lang));
    },
    activityTitle(): string | undefined {
      return this.summary.lastActivityTimeMs === undefined ? undefined : shortDateTime(this.summary.lastActivityTimeMs);
    },
  },
  methods: {
    playersInColumn,
    chipNameParts,
    // Corporation, win and language (own name of the language) in the tooltip: the tile itself stays compact (points only)
    chipTitle(player: AdminPlayerSummary): string {
      return [player.corporation, player.isWinner ? translateText('Winner') : undefined, player.isOnline === true ? translateText('Online') : undefined, player.language === undefined ? undefined : LANGUAGES[player.language][0]].filter((part) => part !== undefined).join(' · ');
    },
    playerColorClass(color: Color): string {
      return playerColorClass(color, 'bg_transparent');
    },
  },
});
</script>
