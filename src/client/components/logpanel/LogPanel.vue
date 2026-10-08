<template>
  <div ref="root" class="log-container">
    <LogGenerationList
      ref="generationList"
      :max="viewModel.game.generation"
      :selected="showsMilestonesAwards ? -1 : selectedGeneration"
      :lastSoloGeneration="lastSoloGeneration"
      @selected="selectGeneration">
      <!-- Desktop: milestones & awards as the first tab of the same box -->
      <template v-if="hasMilestonesAwards" #before>
        <div class="or-tabs log-milestones-tabs" role="tablist">
          <button type="button" role="tab"
            :aria-selected="showsMilestonesAwards"
            :class="['or-tab', 'or-tab--tone-milestones', {'or-tab--active': showsMilestonesAwards}]"
            data-test="log-milestones-tab"
            v-flash-tab="{id: 'log-milestones', areas: ['milestonesAwards'], active: showsMilestonesAwards}"
            @click.prevent="showMilestonesAwards">{{ milestonesAwardsTitle }}</button>
        </div>
      </template>
    </LogGenerationList>
    <div v-docked-tab :class="panelClasses" role="tabpanel">
      <!-- One continuous stream of all generations; the tabs above follow the scroll position -->
      <div v-show="!showsMilestonesAwards" id="logpanel-scrollable" ref="scrollBody" class="panel-body" @scroll="onScroll" @mouseenter="pointerEntered" @mousemove="pointerMoved" @mouseleave="pointerLeft">
        <section v-for="section in sections" :key="section.generation" class="log-generation" :data-generation="section.generation">
          <h3 class="log-generation-title">
            <span class="log-generation-marker" aria-hidden="true">{{ section.generation }}</span>{{ generationTitle(section.generation) }}
          </h3>
          <LogMessageComponent v-for="(message, index) in section.messages" :key="index" :message="message" :viewModel="viewModel" @click="messageClicked(message)" @mouseenter="messageHovered(message, $event)" @spaceClicked="$emit('spaceClicked', $event)"/>
        </section>
      </div>
      <div v-if="hasMilestonesAwards" v-show="showsMilestonesAwards" class="log-milestones">
        <MilestoneAwardTable :milestones="viewModel.game.milestones" :awards="viewModel.game.awards" :players="viewModel.players" :viewerColor="viewModel.thisPlayer?.color" scrollable/>
      </div>
      <button
        v-show="showScrollToBottomButton && !showsMilestonesAwards"
        type="button"
        class="log-latest-button"
        aria-label="Latest logs"
        title="Latest logs"
        data-test="log-latest"
        @click="showLatestLogs"
      >
        <svg class="log-latest-button-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
          <path d="M12 5v14M19 12l-7 7-7-7"/>
        </svg>
      </button>
    </div>
    <LogMessageInspector ref="messageInspector" :viewModel="viewModel"/>
    <LogCardsZoom v-if="zoomedMessage !== undefined" :message="zoomedMessage" :players="viewModel.players" @close="zoomedMessage = undefined"/>
  </div>
</template>

<script lang="ts">

import {defineComponent, markRaw} from 'vue';
import {vDockedTab} from '@/client/directives/DockedTab';
import {vFlashTab} from '@/client/directives/ChangeFlashTab';
import {translateTextWithParams} from '@/client/directives/i18n';
import {LogMessage} from '@/common/logs/LogMessage';
import {LogMessageType} from '@/common/logs/LogMessageType';
import {ViewModel} from '@/common/models/PlayerModel';
import {SoundManager} from '@/client/utils/SoundManager';
import {getPreferences} from '@/client/utils/PreferencesManager';
import {logMessageItemCount, needsModalPreview} from '@/client/components/logpanel/logMessageContent';
import {activeSectionIndex, edgeFadesOf, findScrollContainer, HEADER_SCROLL_GAP, maxScrollTopOf, readingLineOf, scrollContainerTo, ScrollContainer, scrollTopOf} from '@/client/components/logpanel/logScroll';
import LogMessageComponent from '@/client/components/logpanel/LogMessageComponent.vue';
import LogMessageInspector from '@/client/components/logpanel/LogMessageInspector.vue';
import LogGenerationList from '@/client/components/logpanel/LogGenerationList.vue';
import LogCardsZoom from '@/client/components/logpanel/LogCardsZoom.vue';
import MilestoneAwardTable from '@/client/components/milestoneAwardTable/MilestoneAwardTable.vue';
import {milestonesAwardsLabel} from '@/client/components/milestoneAwardTable/milestonesAwardsLabel';
import {cachedLogStream, fetchLogStream, GenerationLog} from '@/client/utils/fetchLogs';
import {milestonesAwardsFocusState} from '@/client/components/logpanel/milestonesAwardsFocus';

const BOTTOM_SCROLL_THRESHOLD = 24; // Roughly one line of log text.

// After a tab click the smooth scroll counts as finished once no scroll event came for this long
const PROGRAMMATIC_SCROLL_SETTLE_MS = 150;

// Content of the box: the log stream or (desktop) the milestones & awards table
type LogView = 'log' | 'milestones';

type ViewState = {
  // Participant the state belongs to (another game starts at the end of its log)
  id: string,
  // Whether it was this player's turn: only a change of turn switches the box automatically,
  // otherwise the reader's own choice survives the remount after every update
  acting: boolean,
  view: LogView,
  // True if the reader was at the end of the log, and so should stay at the end
  // of whatever is newest after a remount.
  following: boolean,
  // Scroll offset of the stream when the reader was somewhere in the history
  scrollTop: number,
};

// The game view remounts on every update (App.vue bumps its key): the reading position survives here
let viewState: ViewState | undefined;

type Refs = {
  root: HTMLElement | undefined;
  scrollBody: HTMLElement | undefined;
  generationList: {$el: HTMLElement} | undefined;
  messageInspector: InstanceType<typeof LogMessageInspector>;
};

type Internals = {
  programmaticScrollTimer: number | undefined,
  scrollFrame: number | undefined,
  scrollFramePending: boolean,
  resizeObserver: ResizeObserver | undefined,
  lastHeight: number,
  // Mouse over the log: the reader is looking at something, new entries don't move the box
  pointerOverLog: boolean,
  // New entries arrived while the mouse was over the log: catch up once it leaves
  newEntriesWhileHovered: boolean,
};

type LogPanelModel = {
  sections: Array<GenerationLog>,
  view: LogView,
  // Generation whose tab is highlighted: follows the scroll position, or the tab just clicked
  selectedGeneration: number,
  showScrollToBottomButton: boolean,
  // True while the reader is at the end of the log, which then keeps following new entries
  following: boolean,
  // Log line whose cards are currently shown in the carousel modal (only with zoomCarousel)
  zoomedMessage: LogMessage | undefined,
  // View before a milestone/award choice switched the box to the table; restored when the choice closes
  viewBeforeFocus: LogView | undefined,
  // Timers and observers of this instance; raw, so they don't trigger re-renders
  internals: Internals,
};

// The header of each generation replaces the server's "Generation N" line
function messageCount(sections: ReadonlyArray<GenerationLog>): number {
  return sections.reduce((sum, section) => sum + section.messages.length, 0);
}

function withoutGenerationLines(messages: Array<LogMessage>): Array<LogMessage> {
  return messages.filter((message) => message.type !== LogMessageType.NEW_GENERATION);
}

function toSections(stream: Array<GenerationLog>): Array<GenerationLog> {
  return stream.map((section) => ({generation: section.generation, messages: withoutGenerationLines(section.messages)}));
}

export default defineComponent({
  name: 'LogPanel',
  props: {
    viewModel: {
      type: Object as () => ViewModel,
      required: true,
    },
    // Offers milestones & awards as the first tab (desktop; mobile shows them in the players screen)
    milestonesAwards: {
      type: Boolean,
      default: false,
    },
    // It's this player's turn: the box then opens on milestones & awards, otherwise on the current generation
    acting: {
      type: Boolean,
      default: false,
    },
    // Mobile view: tapping opens the line's cards as a carousel in a modal, no hover preview
    zoomCarousel: {
      type: Boolean,
      default: false,
    },
  },
  data(): LogPanelModel {
    return {
      sections: [],
      view: 'log',
      selectedGeneration: -1,
      showScrollToBottomButton: false,
      following: true,
      zoomedMessage: undefined,
      viewBeforeFocus: undefined,
      internals: markRaw({programmaticScrollTimer: undefined, scrollFrame: undefined, scrollFramePending: false, resizeObserver: undefined, lastHeight: 0, pointerOverLog: false, newEntriesWhileHovered: false}),
    };
  },
  directives: {
    dockedTab: vDockedTab,
    flashTab: vFlashTab,
  },
  components: {
    LogMessageComponent,
    LogMessageInspector,
    LogGenerationList,
    LogCardsZoom,
    MilestoneAwardTable,
  },
  emits: ['spaceClicked'],
  methods: {
    generationTitle(generation: number): string {
      return translateTextWithParams('Generation ${0}', [String(generation)]);
    },
    // With mouse/trackpad, hover opens the preview; click is only for touch devices without hover
    canHover(): boolean {
      return window.matchMedia('(hover: hover)').matches;
    },
    messageClicked(message: LogMessage) {
      if (this.zoomCarousel) {
        if (logMessageItemCount(message) > 0) {
          this.zoomedMessage = message;
        }
        return;
      }
      // Many cards: always on click, as a modal over the right column
      if (needsModalPreview(message)) {
        this.typedRefs.messageInspector.showModal(message);
      } else if (!this.canHover()) {
        this.typedRefs.messageInspector.show(message);
      }
    },
    messageHovered(message: LogMessage, event: MouseEvent) {
      // Lines with many cards have no hover preview (it would overflow the window), only click
      if (this.zoomCarousel || !this.canHover()) {
        return;
      }
      if (needsModalPreview(message)) {
        // Otherwise the previous row's preview would stay next to this row
        this.typedRefs.messageInspector.hidePreview();
        return;
      }
      // Preview at the top right of the mouse, in window coordinates (position: fixed), so the column overflow doesn't clip it
      this.typedRefs.messageInspector.preview(message, {x: event.clientX, y: event.clientY});
    },
    // The preview hangs on the pointer and moves with it
    pointerMoved(event: MouseEvent) {
      if (this.zoomCarousel) {
        return;
      }
      this.typedRefs.messageInspector.follow({x: event.clientX, y: event.clientY});
    },
    messageUnhovered() {
      this.typedRefs.messageInspector.hidePreview();
    },
    pointerEntered() {
      this.internals.pointerOverLog = true;
    },
    pointerLeft() {
      this.messageUnhovered();
      this.internals.pointerOverLog = false;
      if (this.internals.newEntriesWhileHovered) {
        this.internals.newEntriesWhileHovered = false;
        this.following = true;
        this.restorePosition();
      }
    },
    // ---------- Scrolling ----------
    scrollContainer(): ScrollContainer {
      return findScrollContainer(this.typedRefs.scrollBody);
    },
    // On mobile the log sits on a hidden screen most of the time: page scrolling there belongs to another screen.
    // On desktop the stream is hidden while milestones & awards fill the box.
    isVisible(): boolean {
      return !this.showsMilestonesAwards && (this.typedRefs.scrollBody?.getClientRects().length ?? 0) > 0;
    },
    showMilestonesAwards(): void {
      this.view = 'milestones';
    },
    // A milestone/award choice opened or closed in the action tabs (milestonesAwardsFocus.ts)
    applyMilestonesAwardsFocus(focused: boolean): void {
      if (focused) {
        if (this.view !== 'milestones') {
          this.viewBeforeFocus = this.view;
          this.view = 'milestones';
        }
        return;
      }
      const previous = this.viewBeforeFocus;
      this.viewBeforeFocus = undefined;
      // Only back if the reader didn't pick another tab in the meantime
      if (previous === 'log' && this.view === 'milestones') {
        this.view = 'log';
        this.$nextTick(() => this.revealGeneration(this.selectedGeneration));
      }
    },
    sectionElements(): Array<HTMLElement> {
      return Array.from(this.typedRefs.scrollBody?.querySelectorAll<HTMLElement>('.log-generation') ?? []);
    },
    // Distance from the reading line to a generation's header, in pixels of the scroll container
    offsetToGeneration(generation: number, container: ScrollContainer): number | undefined {
      const section = this.sectionElements().find((element) => element.dataset.generation === String(generation));
      if (section === undefined) {
        return undefined;
      }
      return section.getBoundingClientRect().top - readingLineOf(container, this.typedRefs.generationList?.$el);
    },
    // Tab click: scroll smoothly to that generation's header. The tab stays selected even if the
    // end of the log is reached before the header gets to the top.
    selectGeneration(generation: number): void {
      this.selectedGeneration = generation;
      if (this.showsMilestonesAwards) {
        // Back from milestones & awards: the stream was hidden, so jump there without animation
        this.view = 'log';
        this.$nextTick(() => this.revealGeneration(generation));
        return;
      }
      const container = this.scrollContainer();
      const offset = this.offsetToGeneration(generation, container);
      if (offset === undefined) {
        return;
      }
      this.startProgrammaticScroll();
      scrollContainerTo(container, scrollTopOf(container) + offset - HEADER_SCROLL_GAP, 'smooth');
    },
    // Current generation: its newest entries (and keep following); older ones: their header
    revealGeneration(generation: number): void {
      const container = this.scrollContainer();
      if (generation === this.generation) {
        this.following = true;
        scrollContainerTo(container, Number.MAX_SAFE_INTEGER);
      } else {
        const offset = this.offsetToGeneration(generation, container);
        if (offset !== undefined) {
          scrollContainerTo(container, scrollTopOf(container) + offset - HEADER_SCROLL_GAP);
        }
      }
      this.updateScrollState();
    },
    showLatestLogs(): void {
      this.selectedGeneration = this.generation;
      this.following = true;
      this.startProgrammaticScroll();
      scrollContainerTo(this.scrollContainer(), Number.MAX_SAFE_INTEGER, 'smooth');
    },
    // While scrolling to a clicked tab, the tabs must not jump through the generations in between
    startProgrammaticScroll(): void {
      const internals = this.internals;
      window.clearTimeout(internals.programmaticScrollTimer);
      internals.programmaticScrollTimer = window.setTimeout(() => this.endProgrammaticScroll(), PROGRAMMATIC_SCROLL_SETTLE_MS);
    },
    endProgrammaticScroll(): void {
      this.internals.programmaticScrollTimer = undefined;
      this.updateScrollState();
    },
    onScroll(): void {
      const internals = this.internals;
      if (internals.programmaticScrollTimer !== undefined) {
        // Still moving towards the clicked tab: wait until the movement settles
        this.startProgrammaticScroll();
        return;
      }
      if (internals.scrollFramePending) {
        return;
      }
      internals.scrollFramePending = true;
      internals.scrollFrame = window.requestAnimationFrame(() => {
        internals.scrollFramePending = false;
        this.updateScrollState();
        this.updateSelectedFromScroll();
      });
    },
    // The page scrolls on mobile: only react while the log is the visible screen and scrolls with the page
    onWindowScroll(): void {
      if (this.isVisible() && this.scrollContainer() === window) {
        this.onScroll();
      }
    },
    updateSelectedFromScroll(): void {
      if (this.sections.length === 0) {
        return;
      }
      const container = this.scrollContainer();
      if (this.isNearBottom(container)) {
        this.selectedGeneration = this.sections[this.sections.length - 1].generation;
        return;
      }
      const tops = this.sectionElements().map((element) => element.getBoundingClientRect().top);
      const index = activeSectionIndex(tops, readingLineOf(container, this.typedRefs.generationList?.$el));
      this.selectedGeneration = this.sections[index]?.generation ?? this.generation;
    },
    updateScrollState(): void {
      const container = this.scrollContainer();
      const nearBottom = this.isNearBottom(container);
      this.showScrollToBottomButton = !nearBottom;
      this.following = nearBottom;
      this.updateEdgeFades(container);
    },
    // Soft fade at the top/bottom edge of the box. Set as CSS variables directly on the element:
    // it changes with every scroll frame and must not trigger a re-render.
    updateEdgeFades(container: ScrollContainer): void {
      const body = this.typedRefs.scrollBody;
      if (body === undefined) {
        return;
      }
      // When the page scrolls (mobile) the box has no edges of its own
      const fades = container === body ? edgeFadesOf(body) : {top: 0, bottom: 0};
      body.style.setProperty('--log-fade-top', `${fades.top}px`);
      body.style.setProperty('--log-fade-bottom', `${fades.bottom}px`);
    },
    isNearBottom(container: ScrollContainer): boolean {
      return maxScrollTopOf(container) - scrollTopOf(container) <= BOTTOM_SCROLL_THRESHOLD;
    },
    // Puts the reader back where they were: at the end, or at the stored offset in the history
    restorePosition(): void {
      if (!this.isVisible()) {
        return;
      }
      const container = this.scrollContainer();
      if (this.following) {
        scrollContainerTo(container, Number.MAX_SAFE_INTEGER);
        this.selectedGeneration = this.generation;
      } else {
        scrollContainerTo(container, viewState?.scrollTop ?? 0);
        this.updateSelectedFromScroll();
      }
      this.updateScrollState();
    },
    // Mobile: the log screen was hidden and is shown again (the page jumps to its top) –
    // show the end of the log instead of generation 1
    onResize(): void {
      const height = this.typedRefs.root?.offsetHeight ?? 0;
      const becameVisible = this.internals.lastHeight === 0 && height > 0;
      this.internals.lastHeight = height;
      if (becameVisible && this.scrollContainer() === window) {
        this.following = true;
        this.restorePosition();
      }
    },
    // keepPosition: update in place (new view model) – a reader in the history stays where they are
    loadStream(keepPosition = false): void {
      fetchLogStream(this.viewModel.id, this.generation).then((stream) => {
        if (stream === undefined) {
          return;
        }
        const previousCount = messageCount(this.sections);
        this.sections = toSections(stream);
        // Something new always brings the end of the log into view, unless the mouse rests on the log
        const hasNewEntries = messageCount(this.sections) > previousCount;
        if (hasNewEntries && keepPosition) {
          if (this.internals.pointerOverLog) {
            this.internals.newEntriesWhileHovered = true;
          } else {
            this.following = true;
          }
        }
        if (getPreferences().enable_sounds && window.location.search.includes('experimental=1')) {
          SoundManager.newLog();
        }
        this.$nextTick(() => {
          if (keepPosition && !this.following) {
            this.updateScrollState();
          } else {
            this.restorePosition();
          }
        });
      });
    },
  },
  computed: {
    typedRefs(): Refs {
      return this.$refs as unknown as Refs;
    },
    generation(): number {
      return this.viewModel.game.generation;
    },
    hasMilestonesAwards(): boolean {
      return this.milestonesAwards && this.viewModel.players.length > 1 && !getPreferences().hide_awards_and_milestones;
    },
    showsMilestonesAwards(): boolean {
      return this.hasMilestonesAwards && this.view === 'milestones';
    },
    milestonesAwardsTitle(): string {
      return milestonesAwardsLabel((text) => this.$t(text));
    },
    panelClasses(): Array<string> {
      const tone = this.showsMilestonesAwards ? ['or-tab-panel--tone-milestones', 'log-panel--milestones'] : ['or-tab-panel--view'];
      return ['panel', 'log-panel', 'or-tab-panel', ...tone];
    },
    milestonesAwardsFocused(): boolean {
      return milestonesAwardsFocusState.requests > 0;
    },
    lastSoloGeneration(): number | undefined {
      return this.viewModel.players.length === 1 ? this.viewModel.game.lastSoloGeneration : undefined;
    },
  },
  watch: {
    milestonesAwardsFocused(focused: boolean): void {
      this.applyMilestonesAwardsFocus(focused);
    },
    // The game view is no longer remounted on every update (upstream b669327): load the new entries in place
    viewModel(): void {
      this.loadStream(true);
    },
    // A change of turn decides the box anew, as on mount: own turn → milestones & awards, otherwise the log
    acting(acting: boolean): void {
      const view: LogView = acting ? 'milestones' : 'log';
      if (this.viewBeforeFocus !== undefined) {
        // An open milestone/award choice keeps the box; closing it returns to the new view
        this.viewBeforeFocus = view;
        return;
      }
      if (this.view !== view) {
        this.view = view;
        if (view === 'log') {
          this.following = true;
          this.$nextTick(() => this.restorePosition());
        }
      }
    },
  },
  mounted() {
    const previousState = viewState?.id === this.viewModel.id ? viewState : undefined;
    // A change of turn (or the first mount) decides the box anew: own turn → milestones & awards,
    // otherwise the end of the log. Without a change the reader's view stays as it was.
    const restoredState = previousState?.acting === this.acting ? previousState : undefined;
    this.view = restoredState?.view ?? (this.acting ? 'milestones' : 'log');
    // Either the view starts fresh, or the reader was at the end, which may have grown since the previous instance unmounted
    this.following = restoredState === undefined || restoredState.following;
    this.selectedGeneration = this.generation;
    if (this.milestonesAwardsFocused) {
      this.applyMilestonesAwardsFocus(true);
    }
    // The known history renders right away, so the page doesn't shrink and jump while the current generation loads
    this.sections = toSections(cachedLogStream(this.viewModel.id, this.generation));
    this.internals.lastHeight = this.typedRefs.root?.offsetHeight ?? 0;
    window.addEventListener('scroll', this.onWindowScroll, {passive: true});
    if (typeof ResizeObserver !== 'undefined' && this.typedRefs.root !== undefined) {
      this.internals.resizeObserver = new ResizeObserver(() => this.onResize());
      this.internals.resizeObserver.observe(this.typedRefs.root);
    }
    this.loadStream();
  },
  beforeUnmount() {
    const container = this.scrollContainer();
    viewState = {
      id: this.viewModel.id,
      acting: this.acting,
      // An open milestone/award choice re-applies its focus after the remount; the reader's own view is kept
      view: this.viewBeforeFocus ?? this.view,
      following: this.isVisible() ? this.isNearBottom(container) : this.following,
      scrollTop: this.isVisible() ? scrollTopOf(container) : viewState?.scrollTop ?? 0,
    };
    window.removeEventListener('scroll', this.onWindowScroll);
    window.clearTimeout(this.internals.programmaticScrollTimer);
    if (this.internals.scrollFramePending && this.internals.scrollFrame !== undefined) {
      window.cancelAnimationFrame(this.internals.scrollFrame);
    }
    this.internals.resizeObserver?.disconnect();
  },
});

</script>
