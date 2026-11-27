<template>
  <div id="games-overview" class="games-overview-container">
    <AdminGate active="games" @ready="loadGames">
      <!-- Tools on top: import a result from another server, load a game here again -->
      <div class="games-overview-tools">
        <section class="games-overview-card">
          <h2 v-i18n>Import result</h2>
          <ImportGameForm @imported="loadGames" />
        </section>
        <section class="games-overview-card">
          <h2 v-i18n>Load a game</h2>
          <LoadGameForm />
        </section>
      </div>

      <!-- Accordion, closed by default: the games tables are what the page is mostly opened for -->
      <details v-if="lineups.length > 0" class="games-overview-card games-overview-accordion">
        <summary><h2><span v-i18n>Wins</span> <span class="games-overview-lineup-games">{{ countedGames }} {{ $t(countedGames === 1 ? 'game' : 'games') }}</span></h2></summary>
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
      </details>

      <section v-if="status !== 'done' || summaries.length === 0" class="games-overview-card">
        <LoadingSpinner v-if="status === 'loading'" page />
        <template v-else-if="status === 'error'">
          <p class="games-overview-note"><span v-i18n>The game list could not be loaded.</span> {{ loadFailureText }}</p>
          <div class="server-settings-retry"><button type="button" class="btn btn-tone-quiet" @click="loadGames" v-i18n>Try again</button></div>
        </template>
        <p v-else class="games-overview-note" v-i18n>No games yet.</p>
      </section>
      <p v-if="deleteError !== ''" class="games-overview-card games-overview-note games-overview-note--error">{{ deleteError }}</p>
      <p v-if="shareError !== ''" class="games-overview-card games-overview-note games-overview-note--error">{{ shareError }}</p>
      <!-- Live, open and finished games each in a card of their own (gameGroups.ts) -->
      <template v-if="status === 'done'">
        <GamesTableCard v-for="group in groups" :key="group.key" :groupKey="group.key" :title="group.title" :games="group.games"
          :columns="columns" :deletingIds="deletingIds" :shareStateOf="shareStateOf" @delete="deleteGame" @share="shareGame">
          <!-- Bulk delete only where no one is online (bulkDelete.ts) -->
          <template v-if="group.key === 'open'" #actions>
            <DeleteGameButton v-for="key in bulkDeleteKeys" :key="key" :label="bulkDeleteLabels[key]"
              :count="bulkDeleteIds(group.games, key).length" :isDeleting="bulkDeleting === key"
              @delete="deleteGames(key, bulkDeleteIds(group.games, key))" />
          </template>
        </GamesTableCard>
      </template>
    </AdminGate>
  </div>
</template>

<script lang="ts">
import LoadingSpinner from '@/client/components/common/LoadingSpinner.vue';
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
import DeleteGameButton from '@/client/components/admin/DeleteGameButton.vue';
import {BULK_DELETE_LABELS, BulkDeleteKey, bulkDeleteIds} from '@/client/components/admin/bulkDelete';
import {GameShareState, gameShareState} from '@/client/components/admin/trainingShareState';
import {TrainingShareRequest, TrainingShareResult, TrainingShareStatus} from '@/common/trainingShare/TrainingShareModel';

type DataModel = {
  summaries: Array<AdminGameSummary>;
  status: 'loading' | 'error' | 'done';
  deletingIds: Array<string>;
  bulkDeleting: BulkDeleteKey | undefined;
  deleteError: string;
  loadFailureText: string;
  /** Sharing for the AI training (tab Export): undefined until loaded or if it fails, then no game offers it */
  shareStatus: TrainingShareStatus | undefined;
  sharingIds: Array<string>;
  shareError: string;
};

export default defineComponent({
  name: 'GamesOverview',
  components: {
    AdminGate,
    LoadingSpinner,
    GamesTableCard,
    DeleteGameButton,
    LoadGameForm,
    ImportGameForm,
  },
  data(): DataModel {
    return {
      summaries: [],
      status: 'loading',
      deletingIds: [],
      bulkDeleting: undefined,
      deleteError: '',
      loadFailureText: '',
      shareStatus: undefined,
      sharingIds: [],
      shareError: '',
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
    // Shown on the closed accordion: how many finished games the wins are based on
    countedGames(): number {
      return this.lineups.reduce((sum, lineup) => sum + lineup.games, 0);
    },
    bulkDeleteKeys(): ReadonlyArray<BulkDeleteKey> {
      return Object.keys(BULK_DELETE_LABELS) as Array<BulkDeleteKey>;
    },
    bulkDeleteLabels(): Record<BulkDeleteKey, string> {
      return BULK_DELETE_LABELS;
    },
  },
  methods: {
    bulkDeleteIds,
    // One after the other through the single delete: same server check, rows vanish one by one
    async deleteGames(key: BulkDeleteKey, ids: ReadonlyArray<string>) {
      this.bulkDeleting = key;
      for (const id of ids) {
        await this.deleteGame(id);
      }
      this.bulkDeleting = undefined;
    },
    formatAverage(value: number): string {
      return value.toLocaleString(undefined, {maximumFractionDigits: 1});
    },
    percentText(wins: number, games: number): string {
      return `${Math.round(wins / games * 100)} %`;
    },
    shareStateOf(summary: AdminGameSummary): GameShareState | undefined {
      return gameShareState(summary, this.shareStatus, this.sharingIds);
    },
    async loadShareStatus() {
      try {
        this.shareStatus = await (await fetchOrFail(paths.API_ADMIN_TRAINING_SHARE)).json();
      } catch {
        // Without the state the list simply offers no sharing; the Export tab names the problem
        this.shareStatus = undefined;
      }
    },
    async shareGame(id: string) {
      this.sharingIds.push(id);
      this.shareError = '';
      try {
        const body: TrainingShareRequest = {gameId: id};
        const result: TrainingShareResult = await (await fetchOrFail(paths.API_ADMIN_TRAINING_SHARE, {method: 'POST', body: JSON.stringify(body)})).json();
        if (!result.ok) {
          this.shareError = `${translateTextWithParams('Could not share ${0}', [id])}: ${result.message}`;
        }
      } catch (error) {
        this.shareError = `${translateTextWithParams('Could not share ${0}', [id])}: ${describeFailure(failureOf(error))}`;
      } finally {
        this.sharingIds = this.sharingIds.filter((sharingId) => sharingId !== id);
        await this.loadShareStatus();
      }
    },
    async loadGames() {
      void this.loadShareStatus();
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
