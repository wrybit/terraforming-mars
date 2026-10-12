<template>
  <div id="games-overview" class="games-overview-container">
    <AdminGate active="games" @ready="loadGames">
      <!-- Tools on top: import a result from another server, load a game here again -->
      <div class="games-overview-tools">
        <section class="games-overview-card">
          <h2 v-i18n>Import result</h2>
          <ImportGameForm @imported="loadGames"/>
        </section>
        <section class="games-overview-card">
          <h2 v-i18n>Load a game</h2>
          <LoadGameForm/>
        </section>
      </div>

      <section v-if="lineups.length > 0" class="games-overview-card">
        <h2 v-i18n>Wins</h2>
        <div class="games-overview-lineups">
          <div v-for="lineup in lineups" :key="lineup.lineup" class="games-overview-lineup">
            <h3>{{ lineup.lineup }} <span class="games-overview-lineup-games">{{ lineup.games }} {{ $t(lineup.games === 1 ? 'game' : 'games') }}</span></h3>
            <div class="games-overview-wins">
              <div v-for="count in lineup.counts" :key="count.name" class="games-overview-win">
                <strong>{{ count.name }}</strong>
                <span class="games-overview-win-number">{{ count.wins }}</span>
                <span class="games-overview-win-games">{{ percentText(count.wins, lineup.games) }}</span>
              </div>
            </div>
            <p class="games-overview-averages">
              <span v-if="lineup.averageGenerations !== undefined" v-i18n :title="$t('Average generations')">Generation: ∅ <strong>{{ formatAverage(lineup.averageGenerations) }}</strong></span>
              <span v-if="lineup.averageWinnerPoints !== undefined" v-i18n :title="$t('Average victory points of the winner')">Points: ∅ <strong>{{ formatAverage(lineup.averageWinnerPoints) }}</strong></span>
            </p>
          </div>
        </div>
      </section>

      <section v-if="status !== 'done' || summaries.length === 0" class="games-overview-card">
        <p v-if="status === 'loading'" class="games-overview-note" v-i18n>Loading…</p>
        <template v-else-if="status === 'error'">
          <p class="games-overview-note"><span v-i18n>The game list could not be loaded.</span> {{ loadFailureText }}</p>
          <div class="server-settings-retry"><button type="button" class="btn btn-tone-quiet" @click="loadGames" v-i18n>Try again</button></div>
        </template>
        <p v-else class="games-overview-note" v-i18n>No games yet.</p>
      </section>
      <p v-if="deleteError !== ''" class="games-overview-card games-overview-note games-overview-note--error">{{ deleteError }}</p>
      <!-- Live, open and finished games each in a card of their own (gameGroups.ts) -->
      <template v-if="status === 'done'">
        <GamesTableCard v-for="group in groups" :key="group.key" :groupKey="group.key" :title="group.title" :games="group.games"
          :columns="columns" :deletingIds="deletingIds" @delete="deleteGame"/>
      </template>
    </AdminGate>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {describeFailure, failureOf, fetchOrFail} from '@/client/utils/requestFailure';
import * as constants from '@/common/constants';
import {paths} from '@/common/app/paths';
import {translateTextWithParams} from '@/client/directives/i18n';
import {AdminDeleteGameRequest, AdminGameSummary} from '@/common/admin/AdminGameSummary';
import GamesTableCard from '@/client/components/admin/GamesTableCard.vue';
import LoadGameForm from '@/client/components/LoadGameForm.vue';
import {GameGroup, groupGames} from '@/client/components/admin/gameGroups';
import ImportGameForm from '@/client/components/admin/ImportGameForm.vue';
import AdminGate from '@/client/components/admin/AdminGate.vue';
import {PLAYER_COLUMNS, PlayerColumn} from '@/client/components/admin/playerColumns';
import {LineupWinCounts, winCountsByLineup} from '@/client/components/admin/winCounts';

type DataModel = {
  summaries: Array<AdminGameSummary>;
  status: 'loading' | 'error' | 'done';
  deletingIds: Array<string>;
  deleteError: string;
  loadFailureText: string;
};

export default defineComponent({
  name: 'GamesOverview',
  components: {
    AdminGate,
    GamesTableCard,
    LoadGameForm,
    ImportGameForm,
  },
  data(): DataModel {
    return {
      summaries: [],
      status: 'loading',
      deletingIds: [],
      deleteError: '',
      loadFailureText: '',
    };
  },
  computed: {
    constants(): typeof constants {
      return constants;
    },
    columns(): ReadonlyArray<PlayerColumn> {
      return PLAYER_COLUMNS;
    },
    groups(): Array<GameGroup> {
      return groupGames(this.summaries);
    },
    lineups(): Array<LineupWinCounts> {
      return winCountsByLineup(this.summaries);
    },
  },
  methods: {
    formatAverage(value: number): string {
      return value.toLocaleString(undefined, {maximumFractionDigits: 1});
    },
    percentText(wins: number, games: number): string {
      return `${Math.round(wins / games * 100)} %`;
    },
    async loadGames() {
      try {
        const response = await fetchOrFail(paths.API_ADMIN_GAMES);
        this.summaries = await response.json();
        this.status = 'done';
      } catch (error) {
        this.loadFailureText = describeFailure(failureOf(error));
        this.status = 'error';
      }
    },
    async deleteGame(id: string) {
      this.deletingIds.push(id);
      this.deleteError = '';
      try {
        const body: AdminDeleteGameRequest = {id};
        await fetchOrFail(paths.API_ADMIN_DELETE_GAME, {method: 'POST', body: JSON.stringify(body)});
        // Remove locally instead of reloading: the row disappears immediately, the columns adjust
        this.summaries = this.summaries.filter((summary) => summary.id !== id);
      } catch (error) {
        this.deleteError = `${translateTextWithParams('Could not delete ${0}', [id])}: ${describeFailure(failureOf(error))}`;
      } finally {
        this.deletingIds = this.deletingIds.filter((deletingId) => deletingId !== id);
      }
    },
  },
});
</script>
