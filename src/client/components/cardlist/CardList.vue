<template>
  <div id="card-list" class="card-list" :class="getLanguageCssClass()" @keydown.esc="filtersOpen = false">
    <header class="card-list-header">
      <h1 v-i18n>Cards List</h1>
      <div class="card-list-search">
        <span class="card-list-search-icon" aria-hidden="true"></span>
        <input ref="filter" type="search" class="card-list-search-input" autocomplete="off" :placeholder="searchPlaceholder" :title="$t('Hint: ^ at the start finds titles that begin with the text')" v-model="filterText">
        <button v-if="filterText !== ''" type="button" class="card-list-search-clear" :title="$t('Clear')" @click="clearSearch()">✕</button>
        <SegmentedControl class="card-list-search-scope" :options="searchScopeOptions" v-model="searchScope"/>
      </div>
      <div class="card-list-header-actions">
        <button type="button" class="card-list-filter-toggle" :title="$t('Filters')" @click="filtersOpen = true">
          <span class="card-list-filter-toggle-icon" aria-hidden="true"></span>
          <span>{{ visibleCount }}</span>
          <span v-if="activeFilters.length > 0" class="card-list-filter-toggle-badge">{{ activeFilters.length }}</span>
        </button>
        <LanguageIcon/>
        <PreferencesIcon/>
      </div>
    </header>

    <div class="card-list-scrim" :class="{'card-list-scrim--open': filtersOpen}" @click="filtersOpen = false"></div>

    <div class="card-list-layout">
      <aside ref="filters" class="card-list-filters" :class="{'card-list-filters--open': filtersOpen}">
        <div class="card-list-sheet-head"><h2 v-i18n>Filters</h2></div>

        <section class="card-list-group card-list-summary">
          <div class="card-list-summary-total">
            <strong>{{ visibleCount }}</strong>
            <span>{{ ofTotalText }}</span>
            <button v-if="hasFilters" type="button" class="card-list-link" @click="resetAll()" v-i18n>Clear all</button>
          </div>
          <div v-if="activeFilters.length > 0" class="card-list-active">
            <span v-for="item in activeFilters" :key="`${item.group}:${item.key}`" class="card-list-active-chip">
              <span v-if="item.iconClass" class="card-list-icon" :class="item.iconClass"></span>
              <span v-else-if="item.colorClass" class="card-list-dot" :class="item.colorClass"></span>
              <!-- The price section consists of numbers and is not translated -->
              <span v-if="item.group === 'cost'">{{ item.label }}</span>
              <span v-else v-i18n>{{ item.label }}</span>
              <button type="button" :title="$t('Remove')" @click="removeFilter(item)">✕</button>
            </span>
          </div>
          <SegmentedControl class="card-list-sort" :options="sortOptions" v-model="sortOrder"/>
        </section>

        <CardListFilterGroup title="Card type" :options="typeOptions" :selection="types" :counts="typeCounts"
          @toggle="toggle('types', $event)" @reset="reset('types')"/>
        <section class="card-list-group">
          <header class="card-list-group-head">
            <h2 v-i18n>Cost</h2>
            <button v-if="hasCostFilter" type="button" class="card-list-link" @click="resetCost()" v-i18n>Reset</button>
          </header>
          <CardListCostRange v-model:costMin="costMin" v-model:costMax="costMax" :highest="highestCost"/>
        </section>
        <CardListFilterGroup title="Tags" variant="icons" :options="tagOptions" :selection="tags" :counts="tagCounts"
          @toggle="toggle('tags', $event)" @reset="reset('tags')"/>
        <CardListFilterGroup title="Expansions" :options="expansionOptions" :selection="expansions" :counts="expansionCounts"
          @toggle="toggle('expansions', $event)" @reset="reset('expansions')"/>

        <details ref="moreFilters" class="card-list-group card-list-more">
          <summary @click="moreFiltersChosen = true" v-i18n>More filters</summary>
          <div class="card-list-more-body">
            <div class="card-list-more-row">
              <h3 v-i18n>Victory points</h3>
              <SegmentedControl :options="vpOptions" v-model="vps"/>
            </div>
            <CardListFilterGroup title="Card resources" variant="icons" :options="resourceOptions" :selection="resources" :counts="resourceCounts"
              @toggle="toggle('resources', $event)" @reset="reset('resources')"/>
            <div class="card-list-more-row">
              <h3 v-i18n>Display</h3>
              <div class="card-list-chips card-list-chips--chips">
                <button type="button" class="card-list-chip" :class="{'card-list-chip--selected': tallCards}" :aria-pressed="tallCards" @click="tallCards = !tallCards">
                  <span class="card-list-chip-label" v-i18n>Tall cards</span>
                </button>
                <button type="button" class="card-list-chip" :class="{'card-list-chip--selected': showMetadata}" :aria-pressed="showMetadata" @click="showMetadata = !showMetadata">
                  <span class="card-list-chip-label" v-i18n>Colony details</span>
                </button>
              </div>
            </div>
          </div>
        </details>

        <div class="card-list-sheet-foot">
          <button type="button" class="btn btn-primary" @click="filtersOpen = false">{{ showResultsText }}</button>
        </div>
      </aside>

      <main ref="results" class="card-list-results">
        <CardListSection v-for="section in cardSections" :key="section.title" v-show="section.names.length > 0"
          :title="section.title" :count="section.names.length" :parts="section.parts">
          <CardListCardGrid :names="section.names" :tallCards="tallCards"/>
        </CardListSection>

        <CardListSection v-show="visibleGlobalEvents.length > 0" title="Global Events" :count="visibleGlobalEvents.length" :parts="partsFor('globalEvents', visibleGlobalEvents.length)">
          <div class="card-list-cards">
            <div class="cardbox" v-for="globalEventName in visibleGlobalEvents" :key="globalEventName" v-memo="[globalEventName]">
              <GlobalEvent :globalEventName="globalEventName" type="distant"/>
            </div>
          </div>
        </CardListSection>

        <CardListSection v-show="visibleColonyNames.length > 0" title="Colonies" :count="visibleColonyNames.length" :parts="partsFor('colonyTiles', visibleColonyNames.length)">
          <div class="player_home_colony_cont">
            <div class="player_home_colony" v-for="colonyName in visibleColonyNames" :key="colonyName" v-memo="[colonyName, showMetadata]">
              <Colony :colony="colonyModel(colonyName)"/>
            </div>
          </div>
        </CardListSection>

        <CardListSection v-show="visibleMilestoneNames.length > 0" title="Milestones" :count="visibleMilestoneNames.length" :parts="partsFor('milestones', visibleMilestoneNames.length)">
          <div class="player_home_colony_cont">
            <div class="player_home_colony" v-for="milestoneName in visibleMilestoneNames" :key="milestoneName" v-memo="[milestoneName]">
              <div class="milestones"> <!-- This div is necessary for the CSS. Perhaps find a way to remove that?-->
                <Milestone :milestone="milestoneModel(milestoneName)" :showDescription="true"/>
              </div>
            </div>
          </div>
        </CardListSection>

        <CardListSection v-show="visibleAwardNames.length > 0" title="Awards" :count="visibleAwardNames.length" :parts="partsFor('awards', visibleAwardNames.length)">
          <div class="player_home_colony_cont">
            <div class="player_home_colony" v-for="awardName in visibleAwardNames" :key="awardName" v-memo="[awardName]">
              <div class="awards"> <!-- This div is necessary for the CSS. Perhaps find a way to remove that?-->
                <Award :award="awardModel(awardName)" :showDescription="true"/>
              </div>
            </div>
          </div>
        </CardListSection>

        <CardListSection v-show="visibleAgendaIds.length > 0" title="Agendas" :count="visibleAgendaIds.length" :parts="partsFor('agendas', visibleAgendaIds.length)">
          <div class="player_home_colony_cont">
            <div class="player_home_colony" v-for="id in visibleAgendaIds" :key="id" v-memo="[id]">
              <TurmoilAgendaContainer :agendaId="id"/>
            </div>
          </div>
        </CardListSection>

        <div v-if="visibleCount === 0" class="card-list-empty">
          <p v-i18n>Nothing matches these filters.</p>
          <button type="button" class="btn btn-tone-quiet" @click="resetAll()" v-i18n>Clear all</button>
        </div>
      </main>
    </div>

    <button type="button" class="card-list-scroll-top" :class="{'card-list-scroll-top--visible': showScrollTop}" :title="$t('Back to top')" @click="scrollToTop()">
      <span aria-hidden="true">↑</span>
    </button>
  </div>
</template>

<script lang="ts">

import {defineComponent, markRaw} from 'vue';
import {CardType} from '@/common/cards/CardType';
import {CardName} from '@/common/cards/CardName';
import {partition} from '@/common/utils/utils';
import {getPreferences} from '@/client/utils/PreferencesManager';
import {GlobalEventName} from '@/common/turmoil/globalEvents/GlobalEventName';
import {allGlobalEventNames} from '@/client/turmoil/ClientGlobalEventManifest';
import {getCardOrThrow} from '@/client/cards/ClientCardManifest';
import {COMMUNITY_COLONY_NAMES, OFFICIAL_COLONY_NAMES, PATHFINDERS_COLONY_NAMES} from '@/common/colonies/AllColonies';
import {ColonyModel} from '@/common/models/ColonyModel';
import {ColonyName} from '@/common/colonies/ColonyName';
import {translateText, translateTextWithParams} from '@/client/directives/i18n';
import {MilestoneName, milestoneNames} from '@/common/ma/MilestoneName';
import {AwardName, awardNames} from '@/common/ma/AwardName';
import {ClaimedMilestoneModel} from '@/common/models/ClaimedMilestoneModel';
import {FundedAwardModel} from '@/common/models/FundedAwardModel';
import {TypeOption, CardListModel, hashToModel, modelToHash} from '@/client/components/cardlist/CardListModel';
import {BonusId, BONUS_IDS, PolicyId, POLICY_IDS} from '@/common/turmoil/Types';
import {buildEntries, CardListEntry, countOptions, FilterGroup, FilterState, hasCostRange, highestCost, passesFilters} from '@/client/components/cardlist/cardListEntries';
import {EXPANSION_OPTIONS, FilterOption, optionKeys, RESOURCE_OPTIONS, SectionPart, TAG_OPTIONS, TYPE_COLOR_CLASSES, TYPE_OPTIONS, typeLabel} from '@/client/components/cardlist/cardListOptions';
import {markedOptions, resetOptions, toggleOption} from '@/client/components/cardlist/filterSelection';
import {clearSearchHighlight, highlightSearch} from '@/client/components/cardlist/searchHighlight';
import {SegmentOption} from '@/client/components/create/createGameChoices';
import Colony from '@/client/components/colonies/Colony.vue';
import GlobalEvent from '@/client/components/turmoil/GlobalEvent.vue';
import PreferencesIcon from '@/client/components/PreferencesIcon.vue';
import LanguageIcon from '@/client/components/LanguageIcon.vue';
import Milestone from '@/client/components/Milestone.vue';
import Award from '@/client/components/Award.vue';
import TurmoilAgendaContainer from '@/client/components/cardlist/TurmoilAgendaContainer.vue';
import SegmentedControl from '@/client/components/create/SegmentedControl.vue';
import CardListFilterGroup from '@/client/components/cardlist/CardListFilterGroup.vue';
import CardListSection from '@/client/components/cardlist/CardListSection.vue';
import CardListCardGrid from '@/client/components/cardlist/CardListCardGrid.vue';
import CardListCostRange from '@/client/components/cardlist/CardListCostRange.vue';
import {setDocumentTitle} from '@/client/utils/documentTitle';
import {textFitMetrics} from '@/client/utils/textFit';
import {prefersReducedMotion} from '@/client/utils/motion';

type Refs = {
  filter: HTMLInputElement;
  filters: HTMLElement;
  moreFilters: HTMLDetailsElement;
  results: HTMLElement;
};

// Sections with game cards, in this order
const CARD_SECTIONS: ReadonlyArray<{title: string, types: ReadonlyArray<CardType>}> = [
  {title: 'Project Cards', types: [CardType.AUTOMATED, CardType.ACTIVE, CardType.EVENT]},
  {title: 'Corporations', types: [CardType.CORPORATION]},
  {title: 'Preludes', types: [CardType.PRELUDE]},
  {title: 'CEOs', types: [CardType.CEO]},
  {title: 'Standard Projects', types: [CardType.STANDARD_PROJECT]},
];

type CardSection = {title: string, names: Array<CardName>, parts: Array<SectionPart>};

// One active filter as a removable chip in the summary
type ActiveFilter = FilterOption & {group: FilterGroup | 'vps' | 'cost'};

const FILTER_GROUP_OPTIONS: Record<FilterGroup, ReadonlyArray<FilterOption>> = {
  types: TYPE_OPTIONS,
  tags: TAG_OPTIONS,
  expansions: EXPANSION_OPTIONS,
  resources: RESOURCE_OPTIONS,
};

const VP_OPTIONS: ReadonlyArray<SegmentOption> = [{value: 0, label: 'all'}, {value: 1, label: '+VPs'}, {value: 2, label: '-VPs'}];
const SORT_OPTIONS: ReadonlyArray<SegmentOption> = [{value: 'a', label: 'A-Z'}, {value: '1', label: '0-9'}];
const SEARCH_SCOPE_OPTIONS: ReadonlyArray<SegmentOption> = [{value: 'name', label: 'Card title'}, {value: 'text', label: 'Full text'}];

// Highlight search matches only once typing pauses briefly – otherwise the list re-renders on every keystroke
const HIGHLIGHT_DELAY_MS = 120;

export default defineComponent({
  name: 'CardList',
  components: {
    CardListCardGrid,
    CardListCostRange,
    GlobalEvent,
    Colony,
    Milestone,
    Award,
    TurmoilAgendaContainer,
    PreferencesIcon,
    LanguageIcon,
    SegmentedControl,
    CardListFilterGroup,
    CardListSection,
  },
  data() {
    return {
      ...hashToModel(window.location.hash),
      // Build all entries once; markRaw because they never change and are large
      entries: markRaw(buildEntries()) as ReadonlyArray<CardListEntry>,
      showScrollTop: false,
      // Mobile: filters as a bottom sheet
      filtersOpen: false,
      // If someone expanded or collapsed "More filters" themselves, that wins over the automatic behavior
      moreFiltersChosen: false,
      highlightTimer: undefined as ReturnType<typeof setTimeout> | undefined,
    };
  },
  mounted() {
    setDocumentTitle('Cards List');
    // Don't focus on touch devices, otherwise the keyboard pops up immediately
    if (!window.matchMedia('(pointer: coarse)').matches) {
      this.typedRefs.filter.focus();
    }
    this.delayedSetLocationHash();
    this.measureTitleFit();
    window.addEventListener('scroll', this.handleScroll, {passive: true});
    window.addEventListener('resize', this.fitMoreFilters);
    this.fitMoreFilters();
    this.scheduleHighlight();
  },
  updated() {
    // Filter chips in the summary change the height of the filter column
    this.fitMoreFilters();
    this.scheduleHighlight();
  },
  beforeUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
    window.removeEventListener('resize', this.fitMoreFilters);
    clearTimeout(this.highlightTimer);
    clearSearchHighlight();
  },
  computed: {
    typedRefs(): Refs {
      return this.$refs as unknown as Refs;
    },
    typeOptions(): typeof TYPE_OPTIONS {
      return TYPE_OPTIONS;
    },
    tagOptions(): typeof TAG_OPTIONS {
      return TAG_OPTIONS;
    },
    expansionOptions(): typeof EXPANSION_OPTIONS {
      return EXPANSION_OPTIONS;
    },
    resourceOptions(): typeof RESOURCE_OPTIONS {
      return RESOURCE_OPTIONS;
    },
    vpOptions(): typeof VP_OPTIONS {
      return VP_OPTIONS;
    },
    sortOptions(): typeof SORT_OPTIONS {
      return SORT_OPTIONS;
    },
    searchScopeOptions(): typeof SEARCH_SCOPE_OPTIONS {
      return SEARCH_SCOPE_OPTIONS;
    },
    searchScope: {
      get(): string {
        return this.namesOnly ? 'name' : 'text';
      },
      set(scope: string) {
        this.namesOnly = scope === 'name';
      },
    },
    searchPlaceholder(): string {
      return translateText(this.namesOnly ? 'Search titles' : 'Search all card texts');
    },
    filterState(): FilterState {
      return {
        types: this.types, tags: this.tags, expansions: this.expansions, resources: this.resources,
        vps: this.vps, costMin: this.costMin, costMax: this.costMax,
      };
    },
    // Entries matching the search text – basis for results and hit counts
    textMatches(): Array<CardListEntry> {
      return this.entries.filter((entry) => this.include(entry.name, entry.searchKind));
    },
    visibleEntries(): Array<CardListEntry> {
      return this.textMatches.filter((entry) => passesFilters(entry, this.filterState));
    },
    visibleKeys(): Set<string> {
      return new Set(this.visibleEntries.map((entry) => `${entry.type}:${entry.name}`));
    },
    visibleCount(): number {
      return this.visibleEntries.length;
    },
    typeCounts(): Map<string, number> {
      return countOptions(this.textMatches, this.filterState, 'types');
    },
    tagCounts(): Map<string, number> {
      return countOptions(this.textMatches, this.filterState, 'tags');
    },
    expansionCounts(): Map<string, number> {
      return countOptions(this.textMatches, this.filterState, 'expansions');
    },
    resourceCounts(): Map<string, number> {
      return countOptions(this.textMatches, this.filterState, 'resources');
    },
    ofTotalText(): string {
      return translateTextWithParams('of ${0}', [String(this.entries.length)]);
    },
    showResultsText(): string {
      return translateTextWithParams('Show ${0} results', [String(this.visibleCount)]);
    },
    activeFilters(): Array<ActiveFilter> {
      const active: Array<ActiveFilter> = [];
      for (const group of Object.keys(FILTER_GROUP_OPTIONS) as Array<FilterGroup>) {
        const options = FILTER_GROUP_OPTIONS[group];
        const marked = markedOptions(this[group] as Record<string, boolean>, optionKeys(options));
        options.filter((option) => marked.includes(option.key)).forEach((option) => active.push({...option, group}));
      }
      if (this.hasCostFilter) {
        active.push({group: 'cost', key: 'cost', label: `${this.costMin ?? 0}–${this.costMax ?? this.highestCost} M€`});
      }
      if (this.vps !== 0) {
        active.push({group: 'vps', key: String(this.vps), label: this.vps === 1 ? '+VPs' : '-VPs'});
      }
      return active;
    },
    highestCost(): number {
      return highestCost(this.entries);
    },
    hasCostFilter(): boolean {
      return hasCostRange(this.filterState);
    },
    hasFilters(): boolean {
      return this.activeFilters.length > 0 || this.filterText !== '';
    },
    cardSections(): Array<CardSection> {
      return CARD_SECTIONS.map((section) => {
        const entries = this.visibleEntries.filter((entry) => entry.card !== undefined && section.types.includes(entry.card.type));
        return {
          title: section.title,
          names: this.sort(entries.map((entry) => entry.name as CardName)),
          parts: section.types.map((type) => ({
            label: typeLabel(type),
            colorClass: TYPE_COLOR_CLASSES[type],
            count: entries.filter((entry) => entry.type === type).length,
          })),
        };
      });
    },
    visibleGlobalEvents(): Array<GlobalEventName> {
      const names = Array.from(allGlobalEventNames()).filter((name) => this.isVisible('globalEvents', name));
      return this.sortOrder === 'a' ? this.sort(names) : names;
    },
    visibleColonyNames(): Array<ColonyName> {
      return [...OFFICIAL_COLONY_NAMES, ...COMMUNITY_COLONY_NAMES, ...PATHFINDERS_COLONY_NAMES].filter((name) => this.isVisible('colonyTiles', name));
    },
    visibleMilestoneNames(): Array<MilestoneName> {
      return milestoneNames.toSorted().filter((name) => this.isVisible('milestones', name));
    },
    visibleAwardNames(): Array<AwardName> {
      return awardNames.toSorted().filter((name) => this.isVisible('awards', name));
    },
    visibleAgendaIds(): Array<PolicyId | BonusId> {
      const ids = (POLICY_IDS as ReadonlyArray<PolicyId | BonusId>).concat(BONUS_IDS);
      const [official, expansion] = partition(ids, (id) => id.endsWith('01'));
      official.sort(); // This puts matching party content together.
      expansion.sort();
      return [...official, ...expansion].filter((id) => this.isVisible('agendas', id));
    },
  },
  methods: {
    delayedSetLocationHash(delayms: number = 200) {
      setTimeout(() => {
        const changed = this.setLocationHash();
        this.delayedSetLocationHash(changed ? 10 : 100);
      }, delayms);
    },
    setLocationHash(): boolean {
      const hash = modelToHash(this as unknown as CardListModel);
      const changed = hash !== window.location.hash;
      window.location.hash = hash;
      return changed;
    },
    selectionOf(group: FilterGroup): Record<string, boolean> {
      return this[group] as Record<string, boolean>;
    },
    toggle(group: FilterGroup, key: string): void {
      toggleOption(this.selectionOf(group), optionKeys(FILTER_GROUP_OPTIONS[group]), key);
    },
    reset(group: FilterGroup): void {
      resetOptions(this.selectionOf(group), optionKeys(FILTER_GROUP_OPTIONS[group]));
    },
    removeFilter(filter: ActiveFilter): void {
      if (filter.group === 'vps') {
        this.vps = 0;
      } else if (filter.group === 'cost') {
        this.resetCost();
      } else {
        this.toggle(filter.group, filter.key);
      }
    },
    resetAll(): void {
      (Object.keys(FILTER_GROUP_OPTIONS) as Array<FilterGroup>).forEach((group) => this.reset(group));
      this.vps = 0;
      this.resetCost();
      this.filterText = '';
    },
    resetCost(): void {
      this.costMin = undefined;
      this.costMax = undefined;
    },
    clearSearch(): void {
      this.filterText = '';
      this.typedRefs.filter.focus();
    },
    isVisible(type: TypeOption, name: string): boolean {
      return this.visibleKeys.has(`${type}:${name}`);
    },
    partsFor(type: TypeOption, count: number): Array<SectionPart> {
      return [{label: typeLabel(type), colorClass: TYPE_COLOR_CLASSES[type], count}];
    },
    sort<T extends string>(names: Array<T>): Array<T> {
      if (this.sortOrder === 'a') {
        const translated = names.map((name) => ({name: name, text: translateText(name)}));
        translated.sort((a, b) => a.text.localeCompare(b.text));
        return translated.map((e) => e.name);
      } else {
        const numbered = names.map((name) => ({name: name, number: getCardOrThrow(name as CardName).metadata.cardNumber ?? ''}));
        numbered.sort((a, b) => a.number.localeCompare(b.number));
        return numbered.map((e) => e.name);
      }
    },
    include(name: string, type: 'card' | 'globalEvent' | 'colony' | 'ma' | 'agenda') {
      const normalized = this.filterText.toLocaleUpperCase();
      if (normalized.length === 0) {
        return true;
      }
      if (this.namesOnly) {
        // English and translated title: in German "Ackerbau" should match just like "Farming"
        const titles = [name, translateText(name)].map((title) => title.toLocaleUpperCase());
        if (normalized.startsWith('^')) {
          return titles.some((title) => title.startsWith(normalized.substring(1)));
        }
        return titles.some((title) => title.includes(normalized));
      } else {
        return this.searchIndex.matches(this.filterText, type, name);
      }
    },
    // "More filters" expanded as long as the filter column then still fits without scrolling
    fitMoreFilters(): void {
      const details = this.typedRefs.moreFilters;
      const column = this.typedRefs.filters;
      if (this.moreFiltersChosen || details === undefined || column === undefined) {
        return;
      }
      details.open = true;
      if (column.scrollHeight > column.clientHeight + 1) {
        details.open = false;
      }
    },
    scheduleHighlight(): void {
      clearTimeout(this.highlightTimer);
      this.highlightTimer = setTimeout(() => this.highlight(), HIGHLIGHT_DELAY_MS);
    },
    highlight(): void {
      const results = this.typedRefs.results;
      if (results === undefined) {
        return;
      }
      // For name search only highlight the titles, otherwise everything the full-text search covers
      const containers = this.namesOnly ? results.querySelectorAll('.card-title') : [results];
      highlightSearch(containers, this.filterText);
    },
    getLanguageCssClass() {
      const language = getPreferences().lang;
      return 'language-' + language;
    },
    colonyModel(colonyName: ColonyName): ColonyModel {
      return {
        colonies: this.showMetadata ? ['red', 'blue'] : [],
        isActive: this.showMetadata,
        name: colonyName,
        trackPosition: 3,
        visitor: undefined,
      };
    },
    milestoneModel(name: MilestoneName): ClaimedMilestoneModel {
      return {name, playerName: undefined, color: undefined, scores: []};
    },
    awardModel(name: AwardName): FundedAwardModel {
      return {name, playerName: undefined, color: undefined, scores: []};
    },
    // Reports how long it took to resize every card title once they've all been
    // fitted. Each CardTitle defers its fit until document.fonts.ready, so we
    // wait on the same signal: our child components register their fit callbacks
    // before this parent mounted hook runs, so by the time this resolves they
    // have all recorded their timings.
    measureTitleFit(): void {
      textFitMetrics.reset();
      const report = () => console.log(`Resized ${textFitMetrics.count} card titles in ${textFitMetrics.total.toFixed(1)}ms`);
      // document.fonts is unavailable outside a real browser (e.g. JSDOM tests).
      if (document.fonts === undefined) {
        report();
      } else {
        document.fonts.ready.then(report);
      }
    },
    scrollToTop(): void {
      const smooth = !prefersReducedMotion();
      window.scrollTo({top: 0, behavior: smooth ? 'smooth' : 'auto'});
    },
    // Back-to-top button only after scrolling a good screen height
    handleScroll(): void {
      this.showScrollTop = window.scrollY > window.innerHeight;
    },
  },
});
</script>
