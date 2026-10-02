<template>
  <div id="stats" class="card-list stats" @keydown.esc="filtersOpen = false" @click="followStatsLink">
    <header class="card-list-header">
      <h1><a :href="overviewHref" data-stats-link v-i18n>Statistics</a></h1>
      <span class="stats-header-info">{{ headerInfo }}</span>
      <div class="card-list-header-actions">
        <button type="button" class="card-list-filter-toggle" :title="$t('Filters')" @click="filtersOpen = true">
          <span class="card-list-filter-toggle-icon" aria-hidden="true"></span>
          <span>{{ filteredGames.length }}</span>
          <span v-if="activeFilters > 0" class="card-list-filter-toggle-badge">{{ activeFilters }}</span>
        </button>
        <LanguageIcon/>
        <PreferencesIcon/>
      </div>
    </header>

    <div class="card-list-scrim" :class="{'card-list-scrim--open': filtersOpen}" @click="filtersOpen = false"></div>

    <div class="card-list-layout">
      <aside class="card-list-filters" :class="{'card-list-filters--open': filtersOpen}">
        <div class="card-list-sheet-head"><h2 v-i18n>Filters</h2></div>
        <section class="card-list-group card-list-summary">
          <div class="card-list-summary-total">
            <strong>{{ filteredGames.length }}</strong>
            <span>{{ ofTotalText }}</span>
            <button v-if="activeFilters > 0" type="button" class="card-list-link" @click="resetAll()" v-i18n>Clear all</button>
          </div>
        </section>
        <template v-for="group in groups" :key="group.key">
          <CardListFilterGroup
            v-if="group.options.length > 1"
            :title="group.title"
            :options="group.options"
            :selection="filters.selections[group.key]"
            :counts="countsOf(group)"
            @toggle="toggle(group, $event)"
            @reset="reset(group)"/>
        </template>
        <section v-if="generationRange !== undefined" class="card-list-group">
          <header class="card-list-group-head">
            <h2 v-i18n>Generations</h2>
            <button v-if="filters.maxGeneration !== undefined" type="button" class="card-list-link" @click="filters.maxGeneration = undefined" v-i18n>Reset</button>
          </header>
          <label class="stats-range">
            <span v-i18n>up to</span>
            <input type="range" :min="generationRange.min" :max="generationRange.max" :value="filters.maxGeneration ?? generationRange.max" @input="changeMaxGeneration">
            <strong>{{ filters.maxGeneration ?? generationRange.max }}</strong>
          </label>
        </section>
        <div class="card-list-sheet-foot">
          <button type="button" class="btn btn-primary" @click="filtersOpen = false">{{ showResultsText }}</button>
        </div>
      </aside>

      <main class="stats-main">
        <nav ref="tabs" class="create-game-segmented stats-tabs">
          <a
            v-for="entry in tabs"
            :key="entry.tab"
            :href="tabHref(entry.tab)"
            data-stats-link
            :class="{'create-game-segmented--selected': entry.tab === activeTab}"
            v-i18n>{{ entry.label }}</a>
        </nav>

        <p v-if="status === 'loading'" class="stats-card stats-note" v-i18n>Loading…</p>
        <p v-else-if="status === 'error'" class="stats-card stats-note" v-i18n>Could not load the statistics.</p>
        <p v-else-if="games.length === 0" class="stats-card stats-note" v-i18n>No finished games yet.</p>
        <template v-else>
          <StatsEntityDetail v-if="view.type === 'detail'" :key="`${view.kind}:${view.name}`" :kind="view.kind" :name="view.name" :results="results"/>
          <StatsOverview v-else-if="view.tab === 'overview'" :games="filteredGames" :results="results" :chartWidth="chartWidth"/>
          <StatsPlayersView v-else-if="view.tab === 'players'" :results="results" :names="names"/>
          <StatsRecordsView v-else-if="view.tab === 'records'" :results="results"/>
          <StatsEntityList v-else :key="view.tab" :kind="view.tab" :results="results"/>
        </template>
      </main>
    </div>
  </div>
</template>

<script lang="ts">
import {computed, defineComponent} from 'vue';
import {paths} from '@/common/app/paths';
import {Color} from '@/common/Color';
import {StatsGame} from '@/common/stats/StatsGame';
import {translateTextWithParams} from '@/client/directives/i18n';
import CardListFilterGroup from '@/client/components/cardlist/CardListFilterGroup.vue';
import {optionKeys} from '@/client/components/cardlist/cardListOptions';
import {resetOptions, toggleOption} from '@/client/components/cardlist/filterSelection';
import LanguageIcon from '@/client/components/LanguageIcon.vue';
import PreferencesIcon from '@/client/components/PreferencesIcon.vue';
import StatsOverview from './StatsOverview.vue';
import StatsPlayersView from './StatsPlayersView.vue';
import StatsRecordsView from './StatsRecordsView.vue';
import StatsEntityList from './StatsEntityList.vue';
import StatsEntityDetail from './StatsEntityDetail.vue';
import {activeFilterCount, emptyFilters, filterGames, filterGroups, optionCounts, StatsFilterGroup, StatsFilters} from './statsFilter';
import {parseStatsView, STATS_TABS, statsHref, StatsTab, StatsView, tabOfKind} from './statsNavigation';
import {allPlayerResults, playerColors, playerNames, StatsPlayerResult} from './statsResults';
import {formatDate} from './statsLabels';

// Unterhalb dieser Breite schmalere Diagramme (gleiche Grenze wie das Filter-Sheet der Kartenliste)
const NARROW_WIDTH = 900;

type DataModel = {
  games: Array<StatsGame>;
  status: 'loading' | 'error' | 'done';
  filters: StatsFilters;
  view: StatsView;
  filtersOpen: boolean;
  chartWidth: number;
};

// Öffentliche Statistikseite (/stats). Eigenständig: liest nur /api/stats/games und rechnet alles im Browser aus.
// Aufbau, Filter und Kacheln wie in der Kartenliste, damit sie sich wie ein Teil der App anfühlt.
export default defineComponent({
  name: 'StatsPage',
  components: {CardListFilterGroup, LanguageIcon, PreferencesIcon, StatsOverview, StatsPlayersView, StatsRecordsView, StatsEntityList, StatsEntityDetail},
  provide() {
    // Spielerfarbe überall gleich: die Farbe, in der jemand meistens gespielt hat
    return {playerColors: computed(() => this.colors)};
  },
  data(): DataModel {
    return {
      games: [],
      status: 'loading',
      filters: emptyFilters([]),
      view: parseStatsView(window.location.search),
      filtersOpen: false,
      chartWidth: this.currentChartWidth(),
    };
  },
  mounted() {
    window.addEventListener('popstate', this.readLocation);
    window.addEventListener('resize', this.updateChartWidth);
    this.loadGames();
    this.revealActiveTab();
  },
  watch: {
    activeTab(): void {
      this.revealActiveTab();
    },
  },
  beforeUnmount() {
    window.removeEventListener('popstate', this.readLocation);
    window.removeEventListener('resize', this.updateChartWidth);
  },
  computed: {
    groups(): Array<StatsFilterGroup> {
      return filterGroups(this.games);
    },
    filteredGames(): Array<StatsGame> {
      return filterGames(this.games, this.filters);
    },
    results(): Array<StatsPlayerResult> {
      return allPlayerResults(this.filteredGames);
    },
    names(): Array<string> {
      return playerNames(this.filteredGames);
    },
    colors(): Map<string, Color> {
      return playerColors(this.games);
    },
    activeFilters(): number {
      return activeFilterCount(this.filters);
    },
    activeTab(): StatsTab {
      return this.view.type === 'tab' ? this.view.tab : tabOfKind(this.view.kind);
    },
    tabs(): typeof STATS_TABS {
      return STATS_TABS;
    },
    overviewHref(): string {
      return this.tabHref('overview');
    },
    headerInfo(): string {
      const last = this.games[this.games.length - 1];
      return last === undefined ? '' : translateTextWithParams('${0} games · last on ${1}', [String(this.games.length), formatDate(last.summary.createdTimeMs)]);
    },
    ofTotalText(): string {
      return translateTextWithParams('of ${0} games', [String(this.games.length)]);
    },
    showResultsText(): string {
      return translateTextWithParams('Show ${0} games', [String(this.filteredGames.length)]);
    },
    generationRange(): {min: number, max: number} | undefined {
      const generations = this.games.map((game) => game.summary.generation).filter((generation) => generation > 0);
      if (generations.length === 0 || Math.min(...generations) === Math.max(...generations)) {
        return undefined;
      }
      return {min: Math.min(...generations), max: Math.max(...generations)};
    },
  },
  methods: {
    async loadGames(): Promise<void> {
      try {
        const response = await fetch(paths.API_STATS_GAMES);
        if (!response.ok) {
          throw new Error(await response.text());
        }
        this.games = await response.json();
        this.filters = emptyFilters(this.groups);
        this.status = 'done';
      } catch (error) {
        console.error(error);
        this.status = 'error';
      }
    },
    countsOf(group: StatsFilterGroup): Map<string, number> {
      return optionCounts(this.games, this.filters, group);
    },
    toggle(group: StatsFilterGroup, key: string): void {
      toggleOption(this.filters.selections[group.key], optionKeys(group.options), key);
    },
    reset(group: StatsFilterGroup): void {
      resetOptions(this.filters.selections[group.key], optionKeys(group.options));
    },
    resetAll(): void {
      this.groups.forEach((group) => this.reset(group));
      this.filters.maxGeneration = undefined;
    },
    changeMaxGeneration(event: Event): void {
      const value = Number((event.target as HTMLInputElement).value);
      this.filters.maxGeneration = value >= (this.generationRange?.max ?? value) ? undefined : value;
    },
    tabHref(tab: StatsTab): string {
      return statsHref({type: 'tab', tab});
    },
    // Links innerhalb der Statistik wechseln nur die Ansicht, ohne die Seite neu zu laden; Filter bleiben erhalten
    followStatsLink(event: MouseEvent): void {
      const link = (event.target as HTMLElement).closest('a[data-stats-link]') as HTMLAnchorElement | null;
      if (link === null || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      event.preventDefault();
      window.history.pushState({}, '', link.href);
      this.readLocation();
      window.scrollTo({top: 0});
    },
    // Schmal passen nicht alle Reiter nebeneinander: der aktive soll immer zu sehen sein
    revealActiveTab(): void {
      this.$nextTick(() => {
        const tabs = this.$refs.tabs as HTMLElement | undefined;
        const active = tabs?.querySelector('.create-game-segmented--selected') as HTMLElement | null | undefined;
        if (tabs !== undefined && active !== null && active !== undefined) {
          tabs.scrollLeft = active.offsetLeft - (tabs.clientWidth - active.offsetWidth) / 2;
        }
      });
    },
    readLocation(): void {
      this.view = parseStatsView(window.location.search);
    },
    currentChartWidth(): number {
      return window.innerWidth < NARROW_WIDTH ? 360 : 640;
    },
    updateChartWidth(): void {
      this.chartWidth = this.currentChartWidth();
    },
  },
});
</script>
