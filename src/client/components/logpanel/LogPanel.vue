<template>
  <div class="log-container">
    <LogGenerationList
      :max="viewModel.game.generation"
      :selected="selectedGeneration"
      :lastSoloGeneration="lastSoloGeneration"
      @selected="selectGeneration"/>
    <div v-docked-tab class="panel log-panel or-tab-panel or-tab-panel--view" role="tabpanel">
      <div id="logpanel-scrollable" class="panel-body" @scroll="updateScrollState" @mouseleave="messageUnhovered">
        <LogMessageComponent v-for="(message, index) in messages" :key="index" :message="message" :viewModel="viewModel" @click="messageClicked(message)" @mouseenter="messageHovered(message, $event)" @spaceClicked="$emit('spaceClicked', $event)"/>
      </div>
      <button
        v-show="showScrollToBottomButton"
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

import {defineComponent} from 'vue';
import {vDockedTab} from '@/client/directives/DockedTab';
import {LogMessage} from '@/common/logs/LogMessage';
import {ViewModel} from '@/common/models/PlayerModel';
import {SoundManager} from '@/client/utils/SoundManager';
import {getPreferences} from '@/client/utils/PreferencesManager';
import {logMessageItemCount, needsModalPreview} from '@/client/components/logpanel/logMessageContent';
import LogMessageComponent from '@/client/components/logpanel/LogMessageComponent.vue';
import LogMessageInspector from '@/client/components/logpanel/LogMessageInspector.vue';
import LogGenerationList from '@/client/components/logpanel/LogGenerationList.vue';
import LogCardsZoom from '@/client/components/logpanel/LogCardsZoom.vue';
import {fetchLogs} from '@/client/utils/fetchLogs';

const BOTTOM_SCROLL_THRESHOLD = 24; // Roughly one line of log text.

type ScrollPosition = number | 'bottom';

type ViewState = {
  // The current generation viewed in the log panel, which might be different
  // from the current generation in the game.
  selectedGeneration: number,
  // True if the player was viewing the newest generation, and so should be moved
  // forward to whatever generation is newest after a remount.
  following: boolean,
  // Either 'bottom' which means continue scrolling as new entries appear,
  // or a number which is the pixel height from the top of the widget.
  scrollPosition: ScrollPosition,
};

let viewState: ViewState | undefined;

type Refs = {
  messageInspector: InstanceType<typeof LogMessageInspector>;
};

type LogPanelModel = {
  messages: Array<LogMessage>,
  selectedGeneration: number,
  showScrollToBottomButton: boolean,
  // True while the panel should keep following the newest generation as it changes.
  // False once the player manually navigates to an earlier generation.
  following: boolean,
  // Log line whose cards are currently shown in the carousel modal (only with zoomCarousel)
  zoomedMessage: LogMessage | undefined,
};

// Distance of the hover preview from the log's right edge
const LOG_PREVIEW_INSET = 3;

export default defineComponent({
  name: 'LogPanel',
  props: {
    viewModel: {
      type: Object as () => ViewModel,
      required: true,
    },
    // Mobile view: tapping opens the line's cards as a carousel in a modal, no hover preview
    zoomCarousel: {
      type: Boolean,
      default: false,
    },
  },
  data(): LogPanelModel {
    return {
      messages: [],
      selectedGeneration: -1,
      showScrollToBottomButton: false,
      following: true,
      zoomedMessage: undefined,
    };
  },
  directives: {
    dockedTab: vDockedTab,
  },
  components: {
    LogMessageComponent,
    LogMessageInspector,
    LogGenerationList,
    LogCardsZoom,
  },
  emits: ['spaceClicked'],
  methods: {
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
      if (this.zoomCarousel || !this.canHover() || needsModalPreview(message)) {
        return;
      }
      // Preview vertically centered in the log panel, just inside its right edge, in window coordinates
      // (position: fixed), so it isn't clipped by the column overflow
      const rowElement = event.currentTarget as HTMLElement;
      const panel = (rowElement.closest('.log-panel') ?? rowElement).getBoundingClientRect();
      // Center of the visible part: if the log extends below the window, the card would otherwise be clipped too
      const visibleTop = Math.max(panel.top, 0);
      const visibleBottom = Math.min(panel.bottom, window.innerHeight);
      this.typedRefs.messageInspector.preview(message, {
        top: (visibleTop + visibleBottom) / 2,
        right: window.innerWidth - panel.right + LOG_PREVIEW_INSET,
      });
    },
    messageUnhovered() {
      this.typedRefs.messageInspector.hidePreview();
    },
    selectGeneration(gen: number): void {
      this.following = gen === this.generation;
      if (gen !== this.selectedGeneration) {
        this.getLogsForGeneration(gen, gen === this.generation ? 'bottom' : undefined);
      }
      this.selectedGeneration = gen;
    },
    showLatestLogs(): void {
      this.following = true;
      this.selectedGeneration = this.generation;
      this.getLogsForGeneration(this.generation, 'bottom');
    },
    getLogsForGeneration(generation: number, scrollPosition?: ScrollPosition): void {
      const messages = this.messages;
      fetchLogs(this.viewModel.id, generation)
        .then((data) => {
          if (!data) {
            return;
          }
          messages.length = 0;
          messages.push(...data);
          if (getPreferences().enable_sounds && window.location.search.includes('experimental=1') ) {
            SoundManager.newLog();
          }
          if (scrollPosition === 'bottom') {
            this.$nextTick(this.scrollToEnd);
          } else if (scrollPosition !== undefined) {
            this.$nextTick(() => this.restoreScrollTop(scrollPosition));
          }
        });
    },
    scrollToEnd() {
      const scrollablePanel = this.scrollablePanel;
      if (scrollablePanel !== null) {
        scrollablePanel.scrollTop = scrollablePanel.scrollHeight;
        this.updateScrollState();
      }
    },
    restoreScrollTop(scrollTop: number) {
      const scrollablePanel = this.scrollablePanel;
      if (scrollablePanel !== null) {
        scrollablePanel.scrollTop = scrollTop;
        this.updateScrollState();
      }
    },
    updateScrollState(): void {
      this.showScrollToBottomButton = !this.isNearBottom();
    },
    isNearBottom(): boolean {
      const scrollablePanel = this.scrollablePanel;
      if (scrollablePanel === null) {
        return true;
      }
      const remaining = scrollablePanel.scrollHeight - scrollablePanel.clientHeight - scrollablePanel.scrollTop;
      return remaining <= BOTTOM_SCROLL_THRESHOLD;
    },
  },
  computed: {
    typedRefs(): Refs {
      return this.$refs as unknown as Refs;
    },
    generation(): number {
      return this.viewModel.game.generation;
    },
    lastSoloGeneration(): number | undefined {
      return this.viewModel.players.length === 1 ? this.viewModel.game.lastSoloGeneration : undefined;
    },
    scrollablePanel(): HTMLElement | null {
      return document.getElementById('logpanel-scrollable');
    },
  },
  mounted() {
    const restoredState = viewState;
    if (restoredState !== undefined && restoredState.following === false) {
      this.following = false;
      this.selectedGeneration = restoredState.selectedGeneration;
      this.getLogsForGeneration(this.selectedGeneration, restoredState.scrollPosition);
    } else {
      // Either this is the first mount, or the panel was following the newest
      // generation, which may have advanced since the previous instance unmounted.
      this.following = true;
      this.selectedGeneration = this.generation;
      this.getLogsForGeneration(this.selectedGeneration, 'bottom');
    }
  },
  beforeUnmount() {
    viewState = {
      selectedGeneration: this.selectedGeneration,
      following: this.following,
      scrollPosition: this.isNearBottom() ? 'bottom' : this.scrollablePanel?.scrollTop ?? 'bottom',
    };
  },
});

</script>
