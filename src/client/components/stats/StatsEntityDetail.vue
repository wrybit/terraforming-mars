<template>
  <div class="stats-stack">
    <section class="stats-card stats-detail-head" :class="{'stats-detail-head--asset': hasAsset}">
      <div class="stats-detail-main">
        <a :href="backHref" data-stats-link class="stats-link">← <span v-i18n>{{ backLabel }}</span></a>
        <h2 class="stats-detail-title">
          <StatsEntityName :kind="kind" :name="name"/>
          <span class="stats-dim" v-i18n>{{ definition.singular }}</span>
        </h2>
        <p v-if="detail.results.length === 0" class="stats-note" v-i18n>No games for these filters.</p>
        <StatsKpis v-else :tiles="tiles"/>
      </div>
      <!-- Das Spielmaterial selbst (Karte, Meilenstein, Auszeichnung); Karten zeigt ein Klick groß -->
      <StatsEntityAsset v-if="hasAsset" class="stats-detail-asset" :kind="kind" :name="name"/>
    </section>

    <section v-if="kind === 'board'" class="stats-card">
      <h2 v-i18n>Where cities and greeneries end up</h2>
      <StatsBoardHeatmap :boardName="boardName" :games="games"/>
    </section>

    <div v-if="detail.results.length > 0" class="stats-columns">
      <section v-if="kind === 'player'" class="stats-card">
        <h2 v-i18n>Head to head</h2>
        <StatsTable :columns="headToHeadColumns" :rows="headToHead" :rowKey="keyByOpponent" initialSort="games">
          <template #opponent="{row}"><StatsEntityName kind="player" :name="row.opponent"/></template>
        </StatsTable>
        <p class="stats-note" v-i18n>Shared games: ahead of / behind the opponent.</p>
      </section>
      <section v-else-if="kind !== 'board' || stats.players.length > 1" class="stats-card">
        <h2 v-i18n>By player</h2>
        <StatsTable :columns="playerColumns" :rows="stats.players" :rowKey="keyByName" initialSort="plays">
          <template #name="{row}"><StatsEntityName kind="player" :name="row.name"/></template>
          <template #winRate="{row}"><StatsWinRate :winRate="share(row.wins, row.plays) ?? 0" :expected="row.expectedWinRate"/></template>
        </StatsTable>
      </section>

      <section class="stats-card">
        <h2 v-i18n>By number of players</h2>
        <StatsTable :columns="playerCountColumns" :rows="detail.byPlayerCount" :rowKey="keyByPlayerCount" initialSort="playerCount">
          <template #winRate="{row}"><StatsWinRate :winRate="share(row.wins, row.plays) ?? 0" :expected="row.expectedWinRate"/></template>
        </StatsTable>
      </section>
    </div>

    <!-- Verteilungen wie bei tfmstats: Säule = Partien, gelber Anteil = davon gewonnen -->
    <div v-if="detail.results.length > 0" class="stats-columns">
      <section class="stats-card">
        <h2 v-i18n>Final scores</h2>
        <StatsBarChart :bars="pointBars" axisLabel="Victory points in steps of 10" highlightLabel="Of these won"/>
      </section>
      <section class="stats-card">
        <h2 v-i18n>Game length</h2>
        <StatsBarChart :bars="generationBars" axisLabel="Generations" highlightLabel="Of these won"/>
      </section>
    </div>

    <section v-if="hasPointSources" class="stats-card">
      <h2 v-i18n>Where the points come from</h2>
      <StatsPointSources :results="detail.results" :baseline="kind === 'player' || kind === 'board' ? undefined : results"/>
    </section>

    <div v-if="companions.length > 0" class="stats-columns">
      <section v-for="companion in companions" :key="companion.kind" class="stats-card">
        <h2><span v-i18n>Played together</span>: <span v-i18n>{{ kindLabel(companion.kind) }}</span></h2>
        <StatsTable :columns="companionColumns" :rows="companion.entries.slice(0, companionLimit)" :rowKey="keyByName" initialSort="plays">
          <template #name="{row, rows: shownRows}"><StatsEntityName :kind="companion.kind" :name="row.name" :siblings="namesOf(shownRows)"/></template>
          <template #winRate="{row}"><StatsWinRate :winRate="row.winRate" :expected="row.expectedWinRate"/></template>
        </StatsTable>
        <p class="stats-note" v-i18n>From screenshots only cards with victory points are known.</p>
      </section>
    </div>

    <section v-if="detail.results.length > 0" class="stats-card">
      <h2><span v-i18n>Games</span> <span class="stats-dim">· {{ games.length }}</span></h2>
      <StatsGameList :games="games" :highlighted="highlighted"/>
    </section>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {StatsGame} from '@/common/stats/StatsGame';
import StatsTable from './StatsTable.vue';
import StatsKpis from './StatsKpis.vue';
import {StatsBar, StatsColumn, StatsKpi} from './statsTypes';
import StatsEntityName from './StatsEntityName.vue';
import StatsWinRate from './StatsWinRate.vue';
import StatsGameList from './StatsGameList.vue';
import StatsPointSources from './StatsPointSources.vue';
import StatsEntityAsset from './StatsEntityAsset.vue';
import StatsBoardHeatmap from './StatsBoardHeatmap.vue';
import StatsBarChart from './StatsBarChart.vue';
import {BoardName} from '@/common/boards/BoardName';
import {EntityStats, entityStats} from './statsAggregate';
import {COMPANION_COLUMNS} from './statsColumns';
import {EntityDetail, entityDetail, HeadToHead, headToHead, histogram, PlayerCountStats} from './statsDetail';
import {StatsKind, StatsKindDefinition, STATS_KINDS} from './statsKinds';
import {formatNumber, formatPercent} from './statsLabels';
import {STATS_TABS, statsHref, tabOfKind} from './statsNavigation';
import {StatsPlayerResult} from './statsResults';

// Zeilen je "zusammen gespielt"-Tabelle; mehr wird bei vielen Karten unübersichtlich
const COMPANION_LIMIT = 10;

const share = (wins: number, plays: number) => plays === 0 ? undefined : wins / plays;

// Detailseite eines Eintrags: Kennzahlen, je Spieler, je Spielerzahl, Kombinationen und alle Partien
export default defineComponent({
  name: 'StatsEntityDetail',
  components: {StatsTable, StatsKpis, StatsEntityName, StatsWinRate, StatsGameList, StatsPointSources, StatsEntityAsset, StatsBoardHeatmap, StatsBarChart},
  props: {
    kind: {type: String as PropType<StatsKind>, required: true},
    name: {type: String, required: true},
    results: {type: Array as PropType<ReadonlyArray<StatsPlayerResult>>, required: true},
  },
  data() {
    return {
      companionLimit: COMPANION_LIMIT,
      companionColumns: COMPANION_COLUMNS,
      playerColumns: [
        {key: 'name', label: 'Player', value: (row: {name: string}) => row.name, text: true},
        {key: 'plays', label: 'Played', value: (row: {plays: number}) => row.plays},
        {key: 'wins', label: 'Wins', value: (row: {wins: number}) => row.wins},
        {key: 'winRate', label: 'Win rate', value: (row: {wins: number, plays: number}) => share(row.wins, row.plays), format: (row: {wins: number, plays: number}) => formatPercent(share(row.wins, row.plays))},
      ] as Array<StatsColumn>,
      playerCountColumns: [
        {key: 'playerCount', label: 'Players', value: (row: PlayerCountStats) => row.playerCount, text: true},
        {key: 'plays', label: 'Played', value: (row: PlayerCountStats) => row.plays},
        {key: 'wins', label: 'Wins', value: (row: PlayerCountStats) => row.wins},
        {key: 'winRate', label: 'Win rate', value: (row: PlayerCountStats) => share(row.wins, row.plays), format: (row: PlayerCountStats) => formatPercent(share(row.wins, row.plays))},
      ] as Array<StatsColumn>,
      headToHeadColumns: [
        {key: 'opponent', label: 'Opponent', value: (row: HeadToHead) => row.opponent, text: true},
        {key: 'games', label: 'Games', value: (row: HeadToHead) => row.ahead + row.behind},
        {key: 'ahead', label: 'Ahead', value: (row: HeadToHead) => row.ahead},
        {key: 'behind', label: 'Behind', value: (row: HeadToHead) => row.behind},
        {key: 'share', label: 'Share ahead', value: (row: HeadToHead) => share(row.ahead, row.ahead + row.behind), format: (row: HeadToHead) => formatPercent(share(row.ahead, row.ahead + row.behind))},
      ] as Array<StatsColumn>,
    };
  },
  computed: {
    definition(): StatsKindDefinition {
      return STATS_KINDS[this.kind];
    },
    stats(): EntityStats {
      return entityStats(this.results, this.kind, this.name);
    },
    detail(): EntityDetail {
      return entityDetail(this.results, this.kind, this.name);
    },
    companions(): EntityDetail['companions'] {
      return this.detail.companions.filter((companion) => companion.entries.length > 0);
    },
    boardName(): BoardName {
      return this.name as BoardName;
    },
    hasAsset(): boolean {
      return this.kind !== 'board' && this.kind !== 'player';
    },
    hasPointSources(): boolean {
      return this.detail.results.some((result) => result.details?.victoryPoints !== undefined);
    },
    pointBars(): Array<StatsBar> {
      return histogram(this.detail.results, (result) => result.player.victoryPoints, 10);
    },
    generationBars(): Array<StatsBar> {
      return histogram(this.detail.results, (result) => result.game.summary.generation, 1);
    },
    headToHead(): Array<HeadToHead> {
      return headToHead(this.results, this.name);
    },
    games(): Array<StatsGame> {
      return Array.from(new Set(this.detail.results.map((result) => result.game)));
    },
    /** Wer den Eintrag in welcher Partie hatte – in der Partienliste hervorgehoben (Spielplan: alle). */
    highlighted(): Map<string, Array<string>> {
      const byGame = new Map<string, Array<string>>();
      for (const result of this.detail.results) {
        byGame.set(result.game.summary.id, [...(byGame.get(result.game.summary.id) ?? []), result.player.name]);
      }
      return byGame;
    },
    backHref(): string {
      return statsHref({type: 'tab', tab: tabOfKind(this.kind)});
    },
    backLabel(): string {
      const tab = tabOfKind(this.kind);
      return STATS_TABS.find((entry) => entry.tab === tab)?.label ?? '';
    },
    tiles(): Array<StatsKpi> {
      const stats = this.stats;
      // Spielplan gehört allen in der Partie: dort zählen Partien, Siegquote wäre immer der Zufallswert
      if (this.kind === 'board') {
        return [
          {label: 'Games', value: stats.games},
          {label: 'Avg. generations', value: formatNumber(stats.averageGeneration)},
          {label: 'Avg. points', value: formatNumber(stats.averagePoints)},
          {label: 'Most wins', value: stats.mostWinsBy ?? '–'},
        ];
      }
      return [
        {label: 'Played', value: stats.plays},
        {label: 'Wins', value: stats.wins},
        {label: 'Win rate', value: formatPercent(stats.winRate)},
        {label: 'Expected win rate', value: formatPercent(stats.expectedWinRate)},
        {label: 'Avg. points', value: formatNumber(stats.averagePoints)},
        {label: 'Avg. place', value: formatNumber(stats.averagePlace)},
        {label: 'Avg. generations', value: formatNumber(stats.averageGeneration)},
        {label: 'Best score', value: Math.max(...this.detail.results.map((result) => result.player.victoryPoints))},
      ];
    },
  },
  methods: {
    share,
    namesOf(rows: ReadonlyArray<{name: string}>): Array<string> {
      return rows.map((row) => row.name);
    },
    keyByName(row: {name: string}): string {
      return row.name;
    },
    keyByOpponent(row: HeadToHead): string {
      return row.opponent;
    },
    keyByPlayerCount(row: PlayerCountStats): string {
      return String(row.playerCount);
    },
    kindLabel(kind: StatsKind): string {
      return STATS_KINDS[kind].label;
    },
  },
});
</script>
