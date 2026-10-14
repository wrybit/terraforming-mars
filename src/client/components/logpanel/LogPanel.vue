<template>
  <div ref="root" :class="['log-container', {'log-container--separated': separatesMilestonesAwards}]">
    <!-- Separated: milestones & awards as their own box above the log, always visible; no tab – the box has its own headings -->
    <template v-if="separatesMilestonesAwards">
      <div class="panel or-tab-panel or-tab-panel--tone-milestones log-panel--milestones log-milestones-box" role="region" :aria-label="milestonesAwardsTitle">
        <div class="log-milestones">
          <MilestoneAwardTable :milestones="viewModel.game.milestones" :awards="viewModel.game.awards" :players="viewModel.players" :viewerColor="viewModel.thisPlayer?.color" scrollable @split="tableSplit = $event">
            <template v-if="tableSplit" #corner>
              <LogMilestonesSwitches corner separateOnly :separate="true" @separate="setSeparateMilestonesLog"/>
            </template>
          </MilestoneAwardTable>
        </div>
        <!-- Transposed table (narrow box): no free corner, the switch goes below the table -->
        <LogMilestonesSwitches v-if="!tableSplit" separateOnly :separate="true" @separate="setSeparateMilestonesLog"/>
      </div>
    </template>
    <LogGenerationList
      ref="generationList"
      :max="viewModel.game.generation"
      :selected="showsMilestonesAwards ? -1 : selectedGeneration"
      :lastSoloGeneration="lastSoloGeneration"
      @selected="selectGeneration">
      <!-- Desktop: milestones & awards as the first tab of the same box -->
      <template v-if="hasMilestonesAwards && !separatesMilestonesAwards" #before>
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
      <!-- Filter line above the stream: search field with the active filters as chips, options to fold out -->
      <LogFilterBar v-show="!showsMilestonesAwards" v-model="logFilter" :players="viewModel.players" :me="viewModel.thisPlayer?.color"/>
      <!-- One continuous stream of all generations; the tabs above follow the scroll position -->
      <!-- The edge fade sits on this frame, not on the scrolling box: a mask on the scroll box itself leaves stale,
           overlapping rows in Chrome on Windows while scrolling -->
      <div v-show="!showsMilestonesAwards" ref="scrollFrame" class="log-scroll-frame">
        <div id="logpanel-scrollable" ref="scrollBody" class="panel-body" @scroll="onScroll" @mouseenter="pointerEntered" @mousemove="pointerMoved" @mouseleave="pointerLeft">
        <!-- With an active filter, generations without a matching row are hidden -->
        <section v-for="section in sections" v-show="!filterActive || visibleRows(section).length > 0" :key="section.generation" class="log-generation" :data-generation="section.generation">
          <h3 class="log-generation-title">
            <span class="log-generation-marker" aria-hidden="true">{{ section.generation }}</span>{{ generationTitle(section.generation) }}
          </h3>
          <!-- One row per action (card, action, standard project ...) with its effects; unrecognised messages stay text lines -->
          <template v-for="(row, rowIndex) in visibleRows(section)" :key="rowIndex">
            <div v-if="row.type === 'phase'" class="log-phase-line" aria-hidden="true"></div>
            <!-- Analysis game: hovering an AI row shows rating buttons behind its text (touch: double-tap; key I) -->
            <LogMessageComponent v-else-if="row.type === 'message'" :data-log-row="rowKey(section, row)" :message="row.message" :viewModel="viewModel"
              :class="{'log-row--ai-rateable': isRateable(section, row)}"
              @click="messageClicked(row.message, undefined, section, row)"
              @mouseenter="messageHovered(row.message, $event); rowHovered(section, row, $event)" @mouseleave="rowLeft($event)" @spaceClicked="$emit('spaceClicked', $event)"/>
            <LogActionRow v-else-if="row.type === 'action'" :data-log-row="rowKey(section, row)" :row="row" :viewModel="viewModel"
              :class="{'log-row--ai-rateable': isRateable(section, row)}"
              @click="messageClicked(row.action.lead, row.action, section, row)"
              @mouseenter="messageHovered(row.action.lead, $event, row.action); rowHovered(section, row, $event)" @mouseleave="rowLeft($event)" @spaceClicked="$emit('spaceClicked', $event)"/>
            <LogActionRow v-else :data-log-row="rowKey(section, row)" :row="row" :viewModel="viewModel"/>
            <LogAiRatings v-if="analysisGame && row.type !== 'phase'" :entries="rowRatings(section, row)"/>
          </template>
        </section>
      </div>
      </div>
      <div v-if="hasMilestonesAwards" v-show="showsMilestonesAwards" class="log-milestones">
        <MilestoneAwardTable :milestones="viewModel.game.milestones" :awards="viewModel.game.awards" :players="viewModel.players" :viewerColor="viewModel.thisPlayer?.color" scrollable @split="tableSplit = $event">
          <!-- Switches in the free corner above the names, only while hovering the box -->
          <template v-if="tableSplit" #corner>
            <LogMilestonesSwitches corner :autoOpen="autoMilestonesTab" :separate="separatesMilestonesAwards"
              @autoOpen="setAutoMilestonesTab" @separate="setSeparateMilestonesLog"/>
          </template>
        </MilestoneAwardTable>
      </div>
      <!-- Transposed table (narrow box): no free corner, the switches go below the table -->
      <LogMilestonesSwitches v-if="hasMilestonesAwards && !tableSplit" v-show="showsMilestonesAwards"
        :autoOpen="autoMilestonesTab" :separate="separatesMilestonesAwards" @autoOpen="setAutoMilestonesTab" @separate="setSeparateMilestonesLog"/>
      <button
        v-show="showScrollToBottomButton && !showsMilestonesAwards"
        type="button"
        class="log-latest-button"
        :aria-label="$t('Latest logs')"
        :title="$t('Latest logs')"
        data-test="log-latest"
        @click="showLatestLogs"
      >
        <svg class="log-latest-button-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
          <path d="M12 5v14M19 12l-7 7-7-7"/>
        </svg>
      </button>
    </div>
    <LogAiRateBar v-if="rateBar !== undefined" ref="rateBar" :left="rateBar.left" :top="rateBar.top"
      @rate="rateFromBar" @mouseenter="messageUnhovered()" @mouseleave="rateBarLeft"/>
    <LogMessageInspector ref="messageInspector" :viewModel="viewModel" @pinnedClosed="drawnCardsClosed"/>
    <LogCardsZoom v-if="zoomedMessage !== undefined" :message="zoomedMessage" :action="zoomedAction" :players="viewModel.players" @close="closeZoom"/>
  </div>
</template>

<script lang="ts">

import {defineComponent, markRaw} from 'vue';
import {vDockedTab} from '@/client/directives/DockedTab';
import {vFlashTab} from '@/client/directives/ChangeFlashTab';
import {translateText, translateTextWithParams} from '@/client/directives/i18n';
import {LogMessageDataType} from '@/common/logs/LogMessageDataType';
import {LogMessage} from '@/common/logs/LogMessage';
import {LogMessageType} from '@/common/logs/LogMessageType';
import {ViewModel} from '@/common/models/PlayerModel';
import {SoundManager} from '@/client/utils/SoundManager';
import {getPreferences, PreferencesManager} from '@/client/utils/PreferencesManager';
import {logMessageItemCount, needsModalPreview} from '@/client/components/logpanel/logMessageContent';
import {activeSectionIndex, edgeFadesOf, findScrollContainer, HEADER_SCROLL_GAP, maxScrollTopOf, readingLineOf, scrollContainerTo, ScrollContainer, scrollTopOf} from '@/client/components/logpanel/logScroll';
import LogMessageComponent from '@/client/components/logpanel/LogMessageComponent.vue';
import LogActionRow from '@/client/components/logpanel/LogActionRow.vue';
import {groupLogMessages, LogAction, LogRow} from '@/client/components/logpanel/logActions';
import {hasActionSummary} from '@/client/components/logpanel/LogActionEffects.vue';
import {Color} from '@/common/Color';
import {CardName} from '@/common/cards/CardName';
import LogMessageInspector from '@/client/components/logpanel/LogMessageInspector.vue';
import LogFilterBar from '@/client/components/logpanel/LogFilterBar.vue';
import {isFilterActive, LogFilter, rowMatches} from '@/client/components/logpanel/logFilter';
import LogGenerationList from '@/client/components/logpanel/LogGenerationList.vue';
import LogCardsZoom from '@/client/components/logpanel/LogCardsZoom.vue';
import MilestoneAwardTable from '@/client/components/milestoneAwardTable/MilestoneAwardTable.vue';
import LogMilestonesSwitches from '@/client/components/logpanel/LogMilestonesSwitches.vue';
import {milestonesAwardsLabel} from '@/client/components/milestoneAwardTable/milestonesAwardsLabel';
import {cachedLogStream, fetchLogStream, GenerationLog} from '@/client/utils/fetchLogs';
import {milestonesAwardsFocusState} from '@/client/components/logpanel/milestonesAwardsFocus';
import {latestDrawnCards} from '@/client/components/logpanel/drawnCards';
import LogAiRatings from '@/client/components/logpanel/aiAnalysis/LogAiRatings.vue';
import LogAiRateBar from '@/client/components/logpanel/aiAnalysis/LogAiRateBar.vue';
import {AiFeedbackRating} from '@/common/ai/AiFeedback';

// How much of the player name stays visible in front of the hover bar (the bar covers the rest)
const RATE_BAR_NAME_VISIBLE = 20;
import {aiColorsOf, AiLogTarget, aiTargetOfRow, decisionSummaries} from '@/client/components/logpanel/aiAnalysis/aiLogTarget';
import {aiFeedbackState, loadAiFeedback, openAiDecision, ratingsOf} from '@/client/components/logpanel/aiAnalysis/aiFeedbackState';
import {AiFeedbackEntry} from '@/common/ai/AiFeedback';
import {isTypingTarget} from '@/client/utils/typingTarget';

// Touch: a second tap on the same AI row within this time opens the rating instead of the cards
const DOUBLE_TAP_MS = 350;

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
  // Whether the table has its free corner above the names (not when transposed in a narrow box)
  tableSplit: boolean,
  // True if the reader was at the end of the log, and so should stay at the end
  // of whatever is newest after a remount.
  following: boolean,
  // Scroll offset of the stream when the reader was somewhere in the history
  scrollTop: number,
};

// The game view remounts on every update (App.vue bumps its key): the reading position survives here
let viewState: ViewState | undefined;

// The filter survives the remounts too (per participant)
let savedFilter: {id: string, filter: LogFilter} | undefined;
const NO_FILTER: LogFilter = {options: [], text: ''};

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
  // Analysis game: AI row under the mouse (I key rates it) and the last tap (double-tap on touch)
  hoveredAiTarget: AiLogTarget | undefined,
  // Row element the hover bar belongs to (leaving the row onto the bar keeps it)
  hoveredAiRow: HTMLElement | undefined,
  lastTap: {messageId: string, time: number, timer: number} | undefined,
};

type LogPanelModel = {
  sections: Array<GenerationLog>,
  view: LogView,
  // Ob die Tabelle ihre freie Ecke über den Namen hat (MilestoneAwardTable meldet es per @split)
  tableSplit: boolean,
  // Generation whose tab is highlighted: follows the scroll position, or the tab just clicked
  selectedGeneration: number,
  showScrollToBottomButton: boolean,
  // True while the reader is at the end of the log, which then keeps following new entries
  following: boolean,
  // Log line whose cards are currently shown in the carousel modal (only with zoomCarousel)
  zoomedMessage: LogMessage | undefined,
  // Grouped action row of the zoomed message (effects below the cards)
  zoomedAction: LogAction | undefined,
  // View before a milestone/award choice switched the box to the table; restored when the choice closes
  viewBeforeFocus: LogView | undefined,
  // Newly drawn cards are shown by themselves (drawnCards.ts): the view before, restored once they close
  viewBeforeDrawnCards: LogView | undefined,
  // The carousel (mobile) shows newly drawn cards, not a line the reader tapped
  zoomShowsDrawnCards: boolean,
  // Filter of the stream (LogFilterBar.vue)
  logFilter: LogFilter,
  // Analysis game: rating buttons of the hovered AI row, in window coordinates
  rateBar: {left: number, top: number} | undefined,
  // Timers and observers of this instance; raw, so they don't trigger re-renders
  internals: Internals,
};

// Grouped rows per message list (sections are replaced, not changed, when new entries arrive)
const groupedRows = new WeakMap<Array<LogMessage>, Array<LogRow>>();

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
      tableSplit: true,
      selectedGeneration: -1,
      showScrollToBottomButton: false,
      following: true,
      zoomedMessage: undefined,
      zoomedAction: undefined,
      viewBeforeFocus: undefined,
      viewBeforeDrawnCards: undefined,
      zoomShowsDrawnCards: false,
      rateBar: undefined,
      logFilter: savedFilter !== undefined && savedFilter.id === this.viewModel.id ? savedFilter.filter : NO_FILTER,
      internals: markRaw({programmaticScrollTimer: undefined, scrollFrame: undefined, scrollFramePending: false, resizeObserver: undefined, lastHeight: 0, pointerOverLog: false, newEntriesWhileHovered: false, hoveredAiTarget: undefined, hoveredAiRow: undefined, lastTap: undefined}),
    };
  },
  directives: {
    dockedTab: vDockedTab,
    flashTab: vFlashTab,
  },
  components: {
    LogFilterBar,
    LogMessageComponent,
    LogActionRow,
    LogMessageInspector,
    LogGenerationList,
    LogCardsZoom,
    MilestoneAwardTable,
    LogMilestonesSwitches,
    LogAiRatings,
    LogAiRateBar,
  },
  // drawnCards / drawnCardsClosed: newly drawn cards open by themselves and closed again (mobile switches to the log and back)
  emits: ['spaceClicked', 'drawnCards', 'drawnCardsClosed'],
  methods: {
    generationTitle(generation: number): string {
      return translateTextWithParams('Generation ${0}', [String(generation)]);
    },
    // With mouse/trackpad, hover opens the preview; click is only for touch devices without hover
    canHover(): boolean {
      return window.matchMedia('(hover: hover)').matches;
    },
    messageClicked(message: LogMessage, action?: LogAction, section?: GenerationLog, row?: LogRow) {
      // Touch in an analysis game: an AI row waits a moment for a second tap (rating) before opening its cards
      const target = section === undefined || row === undefined || this.canHover() ? undefined : this.aiTargetOf(section, row);
      if (target !== undefined) {
        const lastTap = this.internals.lastTap;
        const now = Date.now();
        if (lastTap !== undefined && lastTap.messageId === target.messageId && now - lastTap.time < DOUBLE_TAP_MS) {
          window.clearTimeout(lastTap.timer);
          this.internals.lastTap = undefined;
          this.openRating(target);
          return;
        }
        if (lastTap !== undefined) {
          window.clearTimeout(lastTap.timer);
        }
        const timer = window.setTimeout(() => {
          this.internals.lastTap = undefined;
          this.showMessage(message, action);
        }, DOUBLE_TAP_MS);
        this.internals.lastTap = {messageId: target.messageId, time: now, timer};
        return;
      }
      this.showMessage(message, action);
    },
    showMessage(message: LogMessage, action?: LogAction) {
      if (this.zoomCarousel) {
        // Cards of the row as a carousel, with what the action changed below them
        if (logMessageItemCount(message) > 0 || hasActionSummary(action)) {
          this.zoomedMessage = message;
          this.zoomedAction = action;
        }
        return;
      }
      // Many cards: always on click, as a modal over the right column
      if (needsModalPreview(message)) {
        this.typedRefs.messageInspector.showModal(message);
      } else if (!this.canHover()) {
        this.typedRefs.messageInspector.show(message, action);
      }
    },
    // ---------- Newly drawn cards ----------
    // Jump to the end of the log and show the line's cards as if hovered, until the next click anywhere
    showDrawnCards(message: LogMessage): void {
      this.$emit('drawnCards');
      if (this.zoomCarousel) {
        this.zoomShowsDrawnCards = true;
        this.zoomedMessage = message;
        return;
      }
      if (this.view !== 'log') {
        this.viewBeforeDrawnCards = this.view;
        this.view = 'log';
      }
      this.following = true;
      this.$nextTick(() => {
        this.restorePosition();
        // After the scroll to the end: the line's place decides where the cards appear
        requestAnimationFrame(() => {
          const row = this.drawnCardsRow(message);
          row?.scrollIntoView({block: 'nearest'});
          const rect = row?.getBoundingClientRect();
          // Many cards don't fit next to the line: as a modal over the column, like a click on such a line
          const position = rect === undefined || needsModalPreview(message) ? undefined : {x: rect.left + rect.width / 2, y: rect.top + rect.height / 2};
          this.typedRefs.messageInspector.pinPreview(message, position);
        });
      });
    },
    drawnCardsRow(message: LogMessage): HTMLElement | undefined {
      for (const section of this.sections) {
        const index = section.messages.indexOf(message);
        if (index !== -1) {
          // A row lists all messages it shows (rowKey), so the message is found inside a grouped row too
          return this.typedRefs.scrollBody?.querySelector<HTMLElement>(`[data-log-row~="${section.generation}-${index}"]`) ?? undefined;
        }
      }
      return undefined;
    },
    // Rows are derived from the messages; cached per message list so scrolling doesn't regroup
    rowsOf(section: GenerationLog): Array<LogRow> {
      let rows = groupedRows.get(section.messages);
      if (rows === undefined) {
        rows = groupLogMessages(section.messages, {tableau: this.tableauByPlayer});
        groupedRows.set(section.messages, rows);
      }
      return rows;
    },
    // Rows of a generation that pass the filter
    visibleRows(section: GenerationLog): Array<LogRow> {
      const rows = this.rowsOf(section);
      if (!this.filterActive) {
        return rows;
      }
      const me = this.viewModel.thisPlayer?.color;
      return rows.filter((row) => rowMatches(row, this.logFilter, me, this.rowSearchText));
    },
    // Text the free-text search looks in: player, card, milestone/colony/party names and text lines as shown
    rowSearchText(row: LogRow): string {
      const playerName = (color: string | undefined) => this.viewModel.players.find((player) => player.color === color)?.name ?? '';
      if (row.type === 'action') {
        const action = row.action;
        const names = [action.card, action.name, ...action.others.map((other) => playerName(other.player))].filter((name) => name !== undefined);
        return [playerName(action.player), ...names.map((name) => translateText(String(name).split(':')[0]))].join(' ');
      }
      if (row.type === 'message') {
        const data = row.message.data.map((datum) => datum.type === LogMessageDataType.PLAYER ? playerName(String(datum.value)) :
          Array.isArray(datum.value) ? datum.value.map((value) => translateText(String(value))).join(' ') : translateText(String(datum.value)));
        return [translateText(row.message.message), ...data].join(' ');
      }
      return '';
    },
    // ---------- Analysis game: rating AI rows ----------
    aiTargetOf(section: GenerationLog, row: LogRow): AiLogTarget | undefined {
      if (!this.analysisGame) {
        return undefined;
      }
      return aiTargetOfRow(row, section.messages, this.aiColors);
    },
    isRateable(section: GenerationLog, row: LogRow): boolean {
      return this.analysisGame && this.aiTargetOf(section, row) !== undefined;
    },
    rowRatings(section: GenerationLog, row: LogRow): Array<AiFeedbackEntry> {
      // Read here so new ratings re-render the rows
      if (aiFeedbackState.ratings.length === 0) {
        return [];
      }
      const target = this.aiTargetOf(section, row);
      return target === undefined ? [] : ratingsOf(target.messageId);
    },
    rowHovered(section: GenerationLog, row: LogRow, event: MouseEvent): void {
      const target = this.aiTargetOf(section, row);
      const element = event.currentTarget instanceof HTMLElement ? event.currentTarget : undefined;
      this.internals.hoveredAiTarget = target;
      this.internals.hoveredAiRow = target === undefined ? undefined : element;
      this.rateBar = target === undefined || element === undefined || !this.canHover() ? undefined : this.rateBarPosition(element);
    },
    // Over the player name, its first 20 px still visible: the same place in every row, whatever follows the name
    rateBarPosition(row: HTMLElement): {left: number, top: number} {
      const name = row.querySelector('.log-row-name, .log-player') ?? row;
      const box = name.getBoundingClientRect();
      return {left: box.left + RATE_BAR_NAME_VISIBLE, top: box.top + box.height / 2};
    },
    rowLeft(event: MouseEvent): void {
      // Moving onto the bar keeps it (it belongs to the row)
      if (this.isInRateBar(event.relatedTarget)) {
        return;
      }
      this.hideRateBar();
    },
    rateBarLeft(event: MouseEvent): void {
      const next = event.relatedTarget;
      if (next instanceof Node && this.internals.hoveredAiRow?.contains(next)) {
        return;
      }
      this.hideRateBar();
    },
    isInRateBar(element: EventTarget | null): boolean {
      const bar = (this.$refs.rateBar as {$el?: HTMLElement} | undefined)?.$el;
      return element instanceof Node && bar !== undefined && bar.contains(element);
    },
    hideRateBar(): void {
      this.rateBar = undefined;
      this.internals.hoveredAiTarget = undefined;
      this.internals.hoveredAiRow = undefined;
    },
    rateFromBar(rating: AiFeedbackRating | undefined): void {
      const target = this.internals.hoveredAiTarget;
      this.hideRateBar();
      if (target !== undefined) {
        this.openRating(target, rating);
      }
    },
    openRating(target: AiLogTarget, rating?: AiFeedbackRating): void {
      this.typedRefs.messageInspector?.hidePreview();
      const summaries = decisionSummaries(this.sections.flatMap((section) => section.messages));
      openAiDecision(target, this.allAiTargets(), summaries, this.viewModel, rating);
    },
    // Every AI row of the log in order: the dialog steps through them (up/down)
    allAiTargets(): Array<AiLogTarget> {
      return this.sections.flatMap((section) => this.visibleRows(section).flatMap((row) => this.aiTargetOf(section, row) ?? []));
    },
    // I key: the AI row under the mouse, otherwise the newest AI row of the log
    onAnalysisKey(event: KeyboardEvent): void {
      if (event.code !== 'KeyI' || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey || isTypingTarget(event.target)) {
        return;
      }
      if (aiFeedbackState.dialog !== undefined) {
        return;
      }
      const target = this.internals.hoveredAiTarget ?? this.newestAiTarget();
      if (target !== undefined) {
        event.preventDefault();
        this.openRating(target);
      }
    },
    newestAiTarget(): AiLogTarget | undefined {
      for (const section of [...this.sections].reverse()) {
        for (const row of [...this.visibleRows(section)].reverse()) {
          const target = this.aiTargetOf(section, row);
          if (target !== undefined) {
            return target;
          }
        }
      }
      return undefined;
    },
    // All message indexes of a row, space separated: data-log-row~="gen-index" finds any of them
    rowKey(section: GenerationLog, row: LogRow): string {
      return row.indexes.map((index) => section.generation + '-' + index).join(' ');
    },
    drawnCardsClosed(): void {
      if (this.viewBeforeDrawnCards !== undefined) {
        this.view = this.viewBeforeDrawnCards;
        this.viewBeforeDrawnCards = undefined;
      }
      this.$emit('drawnCardsClosed');
    },
    closeZoom(): void {
      this.zoomedMessage = undefined;
      this.zoomedAction = undefined;
      if (this.zoomShowsDrawnCards) {
        this.zoomShowsDrawnCards = false;
        this.$emit('drawnCardsClosed');
      }
    },
    messageHovered(message: LogMessage, event: MouseEvent, action?: LogAction) {
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
      this.typedRefs.messageInspector.preview(message, {x: event.clientX, y: event.clientY}, action);
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
    pointerLeft(event?: MouseEvent) {
      // Onto the rating bar of a row (it sits outside the scroll box): still reading the log
      if (event !== undefined && this.isInRateBar(event.relatedTarget)) {
        this.messageUnhovered();
        return;
      }
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
    setAutoMilestonesTab(on: boolean): void {
      PreferencesManager.INSTANCE.set('auto_milestones_tab', on);
    },
    // Separating shows the log next to the always visible table; joining again keeps the log in front
    setSeparateMilestonesLog(on: boolean): void {
      PreferencesManager.INSTANCE.set('separate_milestones_log', on);
      this.view = 'log';
      this.selectedGeneration = this.generation;
      this.following = true;
      this.$nextTick(() => {
        this.restorePosition();
        // The right column changed its height distribution: let it refit Mars and the log (rightColumnFit.ts)
        window.dispatchEvent(new Event('resize'));
      });
    },
    // The view a change of turn leads to: own turn → milestones & awards (if wanted), otherwise the log
    turnView(acting: boolean): LogView {
      return acting && this.autoMilestonesTab ? 'milestones' : 'log';
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
      // The bar sits in window coordinates: it moves along with its row (or goes when the row is gone)
      const row = this.internals.hoveredAiRow;
      if (this.rateBar !== undefined) {
        if (row !== undefined && row.isConnected) {
          this.rateBar = this.rateBarPosition(row);
        } else {
          this.hideRateBar();
        }
      }
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
      // The tab list renders nothing (comment node as $el) while hidden: then there is no tab bar to measure
      const tabBar = this.typedRefs.generationList?.$el;
      const index = activeSectionIndex(tops, readingLineOf(container, tabBar instanceof HTMLElement ? tabBar : undefined));
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
      const frame = this.$refs.scrollFrame as HTMLElement | undefined;
      frame?.style.setProperty('--log-fade-top', `${fades.top}px`);
      frame?.style.setProperty('--log-fade-bottom', `${fades.bottom}px`);
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
    // Höhe aus dem ResizeObserver-Eintrag: offsetHeight würde ein zusätzliches Layout erzwingen
    onResize(entry: ResizeObserverEntry): void {
      const height = entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height;
      const becameVisible = this.internals.lastHeight === 0 && height > 0;
      this.internals.lastHeight = height;
      if (becameVisible && this.scrollContainer() === window) {
        this.following = true;
        this.restorePosition();
      }
    },
    // keepPosition: update in place (new view model) – a reader in the history stays where they are
    loadStream(keepPosition = false): void {
      if (this.analysisGame) {
        void loadAiFeedback(this.viewModel.id);
      }
      fetchLogStream(this.viewModel.id, this.generation).then((stream) => {
        if (stream === undefined) {
          return;
        }
        const previousCount = messageCount(this.sections);
        this.sections = toSections(stream);
        // Something new always brings the end of the log into view, unless the mouse rests on the log
        const hasNewEntries = messageCount(this.sections) > previousCount;
        // Cards just drawn: show them by themselves (only for live updates, not when the page loads)
        const drawn = hasNewEntries && keepPosition ?
          latestDrawnCards(this.sections.flatMap((section) => section.messages).slice(previousCount), this.viewModel.thisPlayer?.color) :
          undefined;
        if (drawn !== undefined) {
          this.showDrawnCards(drawn);
          return;
        }
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
    // Cards in play per player: older logs explain corporation effects with it (logActions addLegacyCauses)
    tableauByPlayer(): Partial<Record<Color, ReadonlyArray<CardName>>> {
      return Object.fromEntries(this.viewModel.players.map((player) => [player.color, player.tableau.map((card) => card.name)]));
    },
    typedRefs(): Refs {
      return this.$refs as unknown as Refs;
    },
    generation(): number {
      return this.viewModel.game.generation;
    },
    hasMilestonesAwards(): boolean {
      return this.milestonesAwards && this.viewModel.players.length > 1 && !getPreferences().hide_awards_and_milestones;
    },
    // Milestones & awards in their own box above the log: the log box then only holds the log
    separatesMilestonesAwards(): boolean {
      return this.hasMilestonesAwards && getPreferences().separate_milestones_log;
    },
    showsMilestonesAwards(): boolean {
      return this.hasMilestonesAwards && !this.separatesMilestonesAwards && this.view === 'milestones';
    },
    milestonesAwardsTitle(): string {
      return milestonesAwardsLabel((text) => this.$t(text));
    },
    filterActive(): boolean {
      return isFilterActive(this.logFilter);
    },
    panelClasses(): Array<string> {
      const tone = this.showsMilestonesAwards ? ['or-tab-panel--tone-milestones', 'log-panel--milestones'] : ['or-tab-panel--view'];
      return ['panel', 'log-panel', 'or-tab-panel', ...tone];
    },
    milestonesAwardsFocused(): boolean {
      return milestonesAwardsFocusState.requests > 0;
    },
    autoMilestonesTab(): boolean {
      return getPreferences().auto_milestones_tab;
    },
    // Analysis game (create option): AI rows show the AI's cards and decisions and can be rated
    analysisGame(): boolean {
      return this.viewModel.game.gameOptions.aiAnalysis === true;
    },
    aiColors(): ReadonlySet<Color> {
      return aiColorsOf(this.viewModel.players);
    },
    lastSoloGeneration(): number | undefined {
      return this.viewModel.players.length === 1 ? this.viewModel.game.lastSoloGeneration : undefined;
    },
  },
  watch: {
    // Keep the filter for the next remount; changing it starts at the newest matching entries
    logFilter(filter: LogFilter) {
      savedFilter = {id: this.viewModel.id, filter};
      // In the box (desktop) jump to the newest match; on mobile the page scrolls, it stays where the reader is
      this.$nextTick(() => {
        if (this.scrollContainer() !== window) {
          this.showLatestLogs();
        }
      });
    },
    milestonesAwardsFocused(focused: boolean): void {
      this.applyMilestonesAwardsFocus(focused);
    },
    // The game view is no longer remounted on every update (upstream b669327): load the new entries in place
    viewModel(): void {
      this.loadStream(true);
    },
    // A change of turn decides the box anew, as on mount: own turn → milestones & awards (toggle on), otherwise the log
    acting(acting: boolean): void {
      const view = this.turnView(acting);
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
    this.view = restoredState?.view ?? this.turnView(this.acting);
    // Hängt nur von der Breite ab, nicht vom Zug: übernehmen, damit die Schalter nach dem Remount nicht springen
    this.tableSplit = previousState?.tableSplit ?? true;
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
      this.internals.resizeObserver = new ResizeObserver((entries) => this.onResize(entries[entries.length - 1]));
      this.internals.resizeObserver.observe(this.typedRefs.root);
    }
    this.loadStream();
    if (this.analysisGame) {
      window.addEventListener('keydown', this.onAnalysisKey);
    }
  },
  beforeUnmount() {
    const container = this.scrollContainer();
    viewState = {
      id: this.viewModel.id,
      acting: this.acting,
      // An open milestone/award choice re-applies its focus after the remount; the reader's own view is kept
      view: this.viewBeforeFocus ?? this.view,
      tableSplit: this.tableSplit,
      following: this.isVisible() ? this.isNearBottom(container) : this.following,
      scrollTop: this.isVisible() ? scrollTopOf(container) : viewState?.scrollTop ?? 0,
    };
    window.removeEventListener('scroll', this.onWindowScroll);
    window.removeEventListener('keydown', this.onAnalysisKey);
    if (this.internals.lastTap !== undefined) {
      window.clearTimeout(this.internals.lastTap.timer);
    }
    window.clearTimeout(this.internals.programmaticScrollTimer);
    if (this.internals.scrollFramePending && this.internals.scrollFrame !== undefined) {
      window.cancelAnimationFrame(this.internals.scrollFrame);
    }
    this.internals.resizeObserver?.disconnect();
  },
});

</script>
