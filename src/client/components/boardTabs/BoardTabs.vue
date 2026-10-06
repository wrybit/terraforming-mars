<template>
  <div class="board-tabs">
    <!-- Board tabs above the right column: Mars plus one tab per expansion board in this game. Without an expansion board
         there is no bar, the box is just the Mars card. Comment inside so the root stays a single element -->
    <div v-if="tabs.length > 1" class="or-tabs board-tabs-bar" role="tablist">
      <button v-for="tab in tabs" :key="tab" type="button" role="tab"
        :class="['or-tab', 'board-tab', 'board-tab--' + tab, 'or-tab--tone-' + tone(tab), {'or-tab--active': tab === active}]"
        :aria-selected="tab === active"
        :data-test="'board-tab-' + tab"
        @click="select(tab)">
        <span class="board-tab-name">{{ $t(label(tab)) }}</span>
        <!-- The active tab drops its short info: the board itself shows it, the others get the room -->
        <BoardTabLines v-if="tab !== active" :tracks="tracks(tab)"/>
      </button>
    </div>
    <div v-docked-tab ref="panel" :class="['or-tab-panel', 'board-tabs-panel', 'board-tabs-panel--' + active, 'or-tab-panel--tone-' + tone(active), {'board-tabs-panel--single': tabs.length < 2}]" role="tabpanel">
      <!-- Mars always keeps its place: it sets the box height (rightColumnFit.ts), the other boards lie on top of it -->
      <div :class="['board-tabs-mars', {'board-tabs-mars--covered': active !== 'mars'}]">
        <slot name="mars"></slot>
        <!-- Belongs to Mars and is covered with it (mobile: the global parameters as bars) -->
        <slot name="marsAside"></slot>
      </div>
      <!-- All boards stay mounted (v-show): space selection and log highlights look for their spaces in the DOM -->
      <div v-for="tab in otherTabs" :key="tab" v-show="tab === active" :class="['board-tabs-view', 'board-tabs-view--' + tab]" v-bind="fitSize(tab)">
        <slot :name="tab"></slot>
      </div>
      <TileViewToggle v-if="active === 'mars' || active === 'moon'" :tileView="tileView" @toggleTileView="$emit('toggleTileView')"/>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {GameModel} from '@/common/models/GameModel';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {vDockedTab} from '@/client/directives/DockedTab';
import {TileView} from '@/client/components/board/TileView';
import BoardTabLines from './BoardTabLines.vue';
import TileViewToggle from './TileViewToggle.vue';
import {BOARD_TAB_LABEL, BOARD_TAB_TONE, BoardTabId, BoardTabTrack, boardTabTracks, boardTabs} from './boardTabs';
import {boardTabState, selectBoardTab} from './boardTabState';
import {observeBoardTabFit} from './boardTabFit';
import {RING_BOARD_SIZE} from '@/client/components/moon/moonRing';

// Room around the Moon ring for the bonus chips outside the band, plus the vertical padding of the view
// (board_tabs.less: more on top, where a chip sticks out of the drawing)
const MOON_FIT_MARGIN = 16;
const MOON_FIT_TOGGLE = 64;

let stopFit: (() => void) | undefined;

export default defineComponent({
  name: 'BoardTabs',
  components: {BoardTabLines, TileViewToggle},
  directives: {dockedTab: vDockedTab},
  props: {
    game: {
      type: Object as PropType<GameModel>,
      required: true,
    },
    players: {
      type: Array as PropType<ReadonlyArray<PublicPlayerModel>>,
      required: true,
    },
    tileView: {
      type: String as PropType<TileView>,
      required: true,
    },
  },
  emits: ['toggleTileView'],
  computed: {
    tabs(): Array<BoardTabId> {
      return boardTabs(this.game);
    },
    otherTabs(): Array<BoardTabId> {
      return this.tabs.filter((tab) => tab !== 'mars');
    },
    // A tab of an expansion that is not in this game falls back to Mars
    active(): BoardTabId {
      return this.tabs.includes(boardTabState.active) ? boardTabState.active : 'mars';
    },
  },
  mounted() {
    stopFit = observeBoardTabFit(this.$refs.panel as HTMLElement);
  },
  beforeUnmount() {
    stopFit?.();
    stopFit = undefined;
  },
  watch: {
    // A view only gets a size once it is shown: refit on every switch
    active() {
      this.$nextTick(() => {
        stopFit?.();
        stopFit = observeBoardTabFit(this.$refs.panel as HTMLElement);
      });
    },
  },
  methods: {
    fitSize(tab: BoardTabId): Record<string, number> {
      if (tab === 'moon') {
        return {'data-fit-width': RING_BOARD_SIZE + 2 * MOON_FIT_MARGIN, 'data-fit-height': RING_BOARD_SIZE + 2 * MOON_FIT_MARGIN + MOON_FIT_TOGGLE};
      }
      return {};
    },
    tone(tab: BoardTabId): string {
      return BOARD_TAB_TONE[tab];
    },
    label(tab: BoardTabId): string {
      return BOARD_TAB_LABEL[tab];
    },
    tracks(tab: BoardTabId): Array<BoardTabTrack> {
      return boardTabTracks(this.game, this.players, tab);
    },
    select(tab: BoardTabId) {
      selectBoardTab(tab);
    },
  },
});
</script>
