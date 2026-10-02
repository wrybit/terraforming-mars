<template>
  <div class="stats-stack">
    <section class="stats-card">
      <h2 v-i18n>At a glance</h2>
      <StatsKpis :tiles="tiles"/>
      <p v-if="completeGames < games.length" class="stats-note">{{ detailNote }}</p>
    </section>

    <!-- Top 5 nebeneinander; die Karten darin scrollen waagerecht, mobil stehen die Boxen untereinander -->
    <!-- Titel führt zur Top-20-Seite -->
    <div v-if="showcases.some((showcase) => showcase.entries.length > 0)" class="stats-columns">
      <section v-for="showcase in showcases" :key="showcase.kind" class="stats-card">
        <h2><a :href="topHref(showcase.kind)" data-stats-link class="stats-heading-link"><span v-i18n>{{ showcase.title }}</span> <span class="stats-dim">→ Top 20</span></a></h2>
        <StatsShowcase :kind="showcase.kind" :entries="showcase.entries"/>
      </section>
    </div>

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
        <StatsLineChart :series="recentSeries" :labels="recentLabels" :width="chartWidth" highlightLabel="Win"/>
      </section>
      <section class="stats-card">
        <h2 v-i18n>Games by generations</h2>
        <StatsBarChart :bars="generationBars" :width="chartWidth"/>
      </section>
      <section class="stats-card">
        <h2 v-i18n>Avg. points per generation</h2>
        <StatsLineChart :series="pointsSeries" :labels="generationLabels(pointsSeries)" :width="chartWidth"/>
      </section>
      <section class="stats-card">
        <h2 v-i18n>Avg. terraforming per generation</h2>
        <StatsLineChart :series="globalsSeries" :labels="generationLabels(globalsSeries)" :width="chartWidth" :maximumValue="100" :step="20"/>
        <p class="stats-note" v-i18n>Percent of the way to the maximum.</p>
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
import {StatsBar, StatsChartSeries, StatsKpi} from './statsTypes';
import StatsLineChart from './StatsLineChart.vue';
import StatsBarChart from './StatsBarChart.vue';
import StatsShowcase from './StatsShowcase.vue';
import {EntityStats, mostPlayed} from './statsAggregate';
import {average, playerNames, StatsPlayerResult} from './statsResults';
import {gamesByGeneration} from './statsRecords';
import {formatDate, formatNumber} from './statsLabels';
import {averageGlobalsByGeneration, averagePointsByGeneration} from './statsSeries';
import {translateTextWithParams} from '@/client/directives/i18n';
import {statsHref, StatsTopKind} from './statsNavigation';
import {SHOWCASE_SIZE, SHOWCASE_TITLES} from './statsShowcase';

const RECENT_GAMES = 15;

function sum(results: ReadonlyArray<StatsPlayerResult>, valueOf: (result: StatsPlayerResult) => number | undefined): number {
  return results.reduce((total, result) => total + (valueOf(result) ?? 0), 0);
}

// Startansicht: Kennzahlen, Siege je Besetzung (wie in der Admin-Übersicht), Verlauf und Verteilung
export default defineComponent({
  name: 'StatsOverview',
  components: {StatsKpis, StatsLineChart, StatsBarChart, StatsShowcase},
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
      const complete = this.results.filter((result) => result.game.details?.cardsComplete === true);
      return [
        {label: 'Games', value: this.games.length},
        {label: 'Avg. generations', value: formatNumber(average(this.games.map((game) => game.summary.generation).filter((generation) => generation > 0)))},
        {label: 'Avg. winner points', value: formatNumber(average(winners.map((result) => result.player.victoryPoints)), 0)},
        {label: 'Cities', value: sum(complete, (result) => result.details?.cities)},
        {label: 'Greeneries', value: sum(this.results, (result) => result.details?.greeneries)},
        {label: 'Milestones', value: details.reduce((total, entry) => total + entry.milestones.length, 0)},
        {label: 'Awards', value: details.reduce((total, entry) => total + entry.awards.length, 0)},
        {label: 'Cards played', value: sum(complete, (result) => result.details?.cards.length)},
      ];
    },
    completeGames(): number {
      return this.games.filter((game) => game.details?.cardsComplete === true).length;
    },
    detailNote(): string {
      return translateTextWithParams('Cities and cards played: only the ${0} games with the full game state; the rest also from screenshots.', [String(this.completeGames)]);
    },
    recentSeries(): Array<StatsChartSeries> {
      return this.names.map((name) => ({
        name,
        color: this.colorOf(name),
        points: this.recentGames.map((game) => {
          const player = game.summary.players.find((candidate) => candidate.name === name);
          return {
            value: player?.victoryPoints,
            highlight: player?.isWinner,
            title: player === undefined ? undefined : `${name}: ${player.victoryPoints} · ${formatDate(game.summary.createdTimeMs)}`,
          };
        }),
      }));
    },
    recentLabels(): Array<string> {
      return this.recentGames.map((game) => formatDate(game.summary.createdTimeMs).slice(0, 5));
    },
    pointsSeries(): Array<StatsChartSeries> {
      return averagePointsByGeneration(this.results, this.names).map((entry) => ({
        name: entry.name,
        color: this.colorOf(entry.name),
        points: entry.values.map((value, index) => ({value: value === undefined ? undefined : Math.round(value), title: `${entry.name} · ${index + 1}: ${formatNumber(value, 0)}`})),
      }));
    },
    globalsSeries(): Array<StatsChartSeries> {
      return averageGlobalsByGeneration(this.games).map((entry) => ({
        name: entry.label,
        color: entry.color,
        points: entry.values.map((value, index) => ({value: value === undefined ? undefined : Math.round(value), title: `${index + 1}: ${formatNumber(value, 0)} %`})),
      }));
    },
    showcases(): Array<{kind: StatsTopKind, title: string, entries: Array<EntityStats>}> {
      return (['card', 'corporation'] as const).map((kind) => ({kind, title: SHOWCASE_TITLES[kind], entries: mostPlayed(this.results, kind, SHOWCASE_SIZE)}));
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
    // Häufigste zuerst, bei Gleichstand die erfolgreichere
    topHref(kind: StatsTopKind): string {
      return statsHref({type: 'top', kind});
    },
    generationLabels(series: ReadonlyArray<StatsChartSeries>): Array<string> {
      const length = Math.max(0, ...series.map((line) => line.points.length));
      return Array.from({length}, (_, index) => String(index + 1));
    },
    colorOf(name: string): Color {
      return (this.playerColors as Map<string, Color>).get(name) ?? 'neutral';
    },
    playerHref(name: string): string {
      return statsHref({type: 'detail', kind: 'player', name});
    },
  },
});
</script>
