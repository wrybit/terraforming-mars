<template>
  <div id="games-overview" class="games-overview-container">
    <section class="games-overview-card games-overview-head">
      <h1><HomeLink>{{ constants.APP_NAME }}</HomeLink> — Games Overview</h1>
      <ImportGameForm :serverId="serverId" @imported="loadGames"/>
    </section>

    <section v-if="lineups.length > 0" class="games-overview-card">
      <h2>Wins</h2>
      <div class="games-overview-lineups">
        <div v-for="lineup in lineups" :key="lineup.lineup" class="games-overview-lineup">
          <h3>{{ lineup.lineup }} <span class="games-overview-lineup-games">{{ lineup.games }} {{ lineup.games === 1 ? 'game' : 'games' }}</span></h3>
          <div class="games-overview-wins">
            <div v-for="count in lineup.counts" :key="count.name" class="games-overview-win">
              <strong>{{ count.name }}</strong>
              <span class="games-overview-win-number">{{ count.wins }}</span>
              <span class="games-overview-win-games">{{ percentText(count.wins, lineup.games) }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="games-overview-card">
      <p v-if="status === 'loading'" class="games-overview-note">Loading…</p>
      <p v-else-if="status === 'error'" class="games-overview-note games-overview-note--error">Could not load the games. Is the serverId correct?</p>
      <p v-else-if="summaries.length === 0" class="games-overview-note">No games yet.</p>
      <div v-else class="games-overview-scroll">
        <table class="games-overview-table">
          <thead>
            <tr>
              <th></th>
              <th>Game</th>
              <th>Gen</th>
              <th>Spectator</th>
              <th v-for="name in columns" :key="name">{{ name }}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <GameOverview v-for="summary in summaries" :key="summary.id" :summary="summary" :columns="columns" :isDeleting="deletingIds.includes(summary.id)" @delete="deleteGame"/>
          </tbody>
        </table>
      </div>
      <p v-if="deleteError !== ''" class="games-overview-note games-overview-note--error">{{ deleteError }}</p>
    </section>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import * as constants from '@/common/constants';
import {paths} from '@/common/app/paths';
import {AdminDeleteGameRequest, AdminGameSummary} from '@/common/admin/AdminGameSummary';
import GameOverview from '@/client/components/admin/GameOverview.vue';
import ImportGameForm from '@/client/components/admin/ImportGameForm.vue';
import HomeLink from '@/client/components/common/HomeLink.vue';
import {playerColumns} from '@/client/components/admin/playerColumns';
import {LineupWinCounts, winCountsByLineup} from '@/client/components/admin/winCounts';

type DataModel = {
  summaries: Array<AdminGameSummary>;
  status: 'loading' | 'error' | 'done';
  deletingIds: Array<string>;
  deleteError: string;
};

export default defineComponent({
  name: 'GamesOverview',
  components: {
    HomeLink,
    GameOverview,
    ImportGameForm,
  },
  data(): DataModel {
    return {
      summaries: [],
      status: 'loading',
      deletingIds: [],
      deleteError: '',
    };
  },
  mounted() {
    this.loadGames();
  },
  computed: {
    constants(): typeof constants {
      return constants;
    },
    serverId(): string {
      return (new URL(location.href)).searchParams.get('serverId') || '';
    },
    columns(): Array<string> {
      return playerColumns(this.summaries);
    },
    lineups(): Array<LineupWinCounts> {
      return winCountsByLineup(this.summaries);
    },
  },
  methods: {
    percentText(wins: number, games: number): string {
      return `${Math.round(wins / games * 100)} %`;
    },
    adminUrl(path: string): string {
      return `${path}?serverId=${encodeURIComponent(this.serverId)}`;
    },
    async loadGames() {
      try {
        const response = await fetch(this.adminUrl(paths.API_ADMIN_GAMES));
        if (!response.ok) {
          throw new Error(await response.text());
        }
        this.summaries = await response.json();
        this.status = 'done';
      } catch {
        this.status = 'error';
      }
    },
    async deleteGame(id: string) {
      this.deletingIds.push(id);
      this.deleteError = '';
      try {
        const body: AdminDeleteGameRequest = {id};
        const response = await fetch(this.adminUrl(paths.API_ADMIN_DELETE_GAME), {method: 'POST', body: JSON.stringify(body)});
        if (!response.ok) {
          throw new Error(await response.text());
        }
        // Lokal entfernen statt neu laden: die Zeile verschwindet sofort, die Spalten passen sich an
        this.summaries = this.summaries.filter((summary) => summary.id !== id);
      } catch (error) {
        this.deleteError = `Could not delete ${id}: ${error instanceof Error ? error.message : String(error)}`;
      } finally {
        this.deletingIds = this.deletingIds.filter((deletingId) => deletingId !== id);
      }
    },
  },
});
</script>
