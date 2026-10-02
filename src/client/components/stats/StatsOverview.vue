<template>
  <div class="stats-stack">
    <section class="stats-card">
      <h2 v-i18n>At a glance</h2>
      <StatsKpis :tiles="tiles"/>
      <p v-if="detailedGames < games.length" class="stats-note">{{ detailNote }}</p>
    </section>

    <section v-if="lineups.length > 0" class="stats-card">
      <h2 v-i18n>Wins per lineup</h2>
      <div class="stats-lineups">
        <div v-for="lineup in lineups" :key="lineup.lineup">
          <h3>{{ lineup.lineup }} <span class="stats-dim">· {{ lineup.games }} <span v-i18n>games</span></span></h3>
          <div class="stats-wins">
            <a v-for="count in lineup.counts" :key="count.name" :href="playerHref(count.name)" data-stats-link class="stats-win" :class="`player_translucent_bg_color_${colorOf(count.name)}`">
              <span class="stats-win-number">{{ count.wins }}</span>
              <span class="stats-win-name">{{ count.name }}</span>
            </a>
          </div>
          <p class="stats-averages">
            <span><span v-i18n>Avg. generations</span> <strong>{{ formatNumber(lineup.averageGenerations) }}</strong></span>
            <span><span v-i18n>Avg. winner points</span> <strong>{{ formatNumber(lineup.averageWinnerPoints, 0) }}</strong></span>
          </p>
        </div>
      </div>
    </section>

    <div class="stats-columns">
      <section class="stats-card">
        <h2 v-i18n>Points in the last games</h2>
        <StatsLineChart :games="recentGames" :names="names" :width="chartWidth"/>
      </section>
      <section class="stats-card">
        <h2 v-i18n>Games by generations</h2>
        <StatsBarChart :bars="generationBars" :width="chartWidth"/>
      </section>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {Color} from '@/common/Color';
import {StatsGame} from '@/common/stats/StatsGame';
import {LineupWinCounts, winCountsByLineup} from '@/client/components/admin/winCounts';
import StatsKpis from './StatsKpis.vue';
import {StatsBar, StatsKpi} from './statsTypes';
import StatsLineChart from './StatsLineChart.vue';
import StatsBarChart from './StatsBarChart.vue';
import {average, playerNames, StatsPlayerResult} from './statsResults';
import {gamesByGeneration} from './statsRecords';
import {formatNumber} from './statsLabels';
import {translateTextWithParams} from '@/client/directives/i18n';
import {statsHref} from './statsNavigation';

const RECENT_GAMES = 15;

function sum(results: ReadonlyArray<StatsPlayerResult>, valueOf: (result: StatsPlayerResult) => number | undefined): number {
  return results.reduce((total, result) => total + (valueOf(result) ?? 0), 0);
}

// Startansicht: Kennzahlen, Siege je Besetzung (wie in der Admin-Übersicht), Verlauf und Verteilung
export default defineComponent({
  name: 'StatsOverview',
  components: {StatsKpis, StatsLineChart, StatsBarChart},
  inject: {
    playerColors: {default: () => new Map<string, Color>()},
  },
  props: {
    games: {type: Array as PropType<ReadonlyArray<StatsGame>>, required: true},
    results: {type: Array as PropType<ReadonlyArray<StatsPlayerResult>>, required: true},
    chartWidth: {type: Number, required: true},
  },
  computed: {
    tiles(): Array<StatsKpi> {
      const winners = this.results.filter((result) => result.place === 1);
      const details = this.games.flatMap((game) => game.details === undefined ? [] : [game.details]);
      return [
        {label: 'Games', value: this.games.length},
        {label: 'Avg. generations', value: formatNumber(average(this.games.map((game) => game.summary.generation).filter((generation) => generation > 0)))},
        {label: 'Avg. winner points', value: formatNumber(average(winners.map((result) => result.player.victoryPoints)), 0)},
        {label: 'Cities', value: sum(this.results, (result) => result.details?.cities)},
        {label: 'Greeneries', value: sum(this.results, (result) => result.details?.greeneries)},
        {label: 'Milestones', value: details.reduce((total, entry) => total + entry.milestones.length, 0)},
        {label: 'Awards', value: details.reduce((total, entry) => total + entry.awards.length, 0)},
        {label: 'Cards played', value: sum(this.results, (result) => result.details?.cards.length)},
      ];
    },
    detailedGames(): number {
      return this.games.filter((game) => game.details !== undefined).length;
    },
    detailNote(): string {
      return translateTextWithParams('Cities, greeneries, milestones, awards and cards: only the ${0} games with a saved final state.', [String(this.detailedGames)]);
    },
    lineups(): Array<LineupWinCounts> {
      return winCountsByLineup(this.games.map((game) => game.summary));
    },
    names(): Array<string> {
      return playerNames(this.games);
    },
    recentGames(): ReadonlyArray<StatsGame> {
      return this.games.slice(-RECENT_GAMES);
    },
    generationBars(): Array<StatsBar> {
      return gamesByGeneration(this.games).map((entry) => ({label: String(entry.generation), value: entry.games}));
    },
  },
  methods: {
    formatNumber,
    colorOf(name: string): Color {
      return (this.playerColors as Map<string, Color>).get(name) ?? 'neutral';
    },
    playerHref(name: string): string {
      return statsHref({type: 'detail', kind: 'player', name});
    },
  },
});
</script>
