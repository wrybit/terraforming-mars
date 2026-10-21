<template>
  <div :class="tableClasses" :style="variables">
    <!-- Player list as a table; arrangement and size follow the available width (playersTableLayout.ts) -->
    <PlayersTableHeader :mode="fit.mode" :tagColumns="tagColumns"/>
    <div class="players-table-rows" :style="{gridTemplateRows: tracks.template}">
      <PlayersTableRow v-for="(row, index) in rows" :key="row.player.color"
        :style="{gridRow: String(tracks.lines[index])}"
        :player="row.player"
        :playerView="playerView"
        :firstForGen="row.firstForGen"
        :actionLabel="row.actionLabel"
        :playerIndex="row.playerIndex"
        :tagColumns="tagColumns"
        :tagDetails="tagDetailsByColor[row.player.color]"
        :productionLeaders="productionLeadersByColor[row.player.color] ?? []"/>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {PLAYERS_TABLE_ZOOM_VARIABLE} from '@/client/utils/playersCardFit';
import {ViewModel} from '@/common/models/PlayerModel';
import {Color} from '@/common/Color';
import {Resource} from '@/common/Resource';
import PlayersTableHeader from '@/client/components/overview/PlayersTableHeader.vue';
import PlayersTableRow from '@/client/components/overview/PlayersTableRow.vue';
import {TAG_ORDER, TagDetails, buildTagDetails, isTagInGame} from '@/client/components/overview/playerTagDetails';
import {PlayerGood, playerGoods} from '@/client/components/overview/playerGoods';
import {NameWidths, PlayersTableFit, PlayersTableRowModel, RowTracks, TagColumnGroups, fitPlayersTable, rowTracks, tableVariables} from '@/client/components/overview/playersTableLayout';

// Status plaque with a running clock ("● 12:34:56") at scale 1
const STATUS_PLAQUE_WIDTH = 92;
let measuringCanvas: HTMLCanvasElement | undefined;

// Width of a text in the table font at the given size (scale 1), with a generous estimate where canvas isn't available
function textWidth(text: string, fontSize: number): number {
  measuringCanvas ??= typeof document !== 'undefined' ? document.createElement('canvas') : undefined;
  const context = measuringCanvas?.getContext?.('2d');
  if (!context) {
    return text.length * fontSize * 0.6;
  }
  context.font = `${fontSize}px Prototype, sans-serif`;
  return Math.ceil(context.measureText(text).width);
}

// Contents of a goods box at scale 1 (players_table.less): stock (own row 23px), gap 5, production plaque
// (13px, at least 24px wide), paddings 11, 2px for rounding; the shield only on protected stock
const STOCK_FONT_SIZE = 23;
const PRODUCTION_FONT_SIZE = 13;
const PRODUCTION_MIN_WIDTH = 24;
const GOODS_BOX_EXTRA = 5 + 11 + 2;
const PROTECTION_SHIELD_WIDTH = 19;
function goodsTextWidth(good: PlayerGood): number {
  const productionText = good.production > 0 ? `+${good.production}` : String(good.production);
  const shield = good.resourceProtection === 'off' ? 0 : PROTECTION_SHIELD_WIDTH;
  return textWidth(String(good.count), STOCK_FONT_SIZE) + Math.max(PRODUCTION_MIN_WIDTH, textWidth(productionText, PRODUCTION_FONT_SIZE) + 6) + GOODS_BOX_EXTRA + shield;
}

type DataModel = {
  // Width of the table; 0 while it is invisible or not yet measured
  availableWidth: number;
  resizeObserver: ResizeObserver | undefined;
};

export default defineComponent({
  name: 'PlayersTable',
  components: {
    PlayersTableHeader,
    PlayersTableRow,
  },
  props: {
    playerView: {
      type: Object as () => ViewModel,
      required: true,
    },
    // Order as in the classic bar: opponents in turn order, yourself last
    rows: {
      type: Array as () => Array<PlayersTableRowModel>,
      required: true,
    },
  },
  data(): DataModel {
    return {
      availableWidth: 0,
      resizeObserver: undefined,
    };
  },
  // Watch the width: arrangement and size of the table follow it (never scrolls sideways)
  mounted() {
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    this.resizeObserver = new ResizeObserver((entries) => {
      // Scaled down via the drag handle (playersCardFit.ts) the table keeps its arrangement: measure in unscaled px.
      // Sizes above 1 only boost numbers and boxes, the table itself is not zoomed then
      const zoom = Math.min(1, parseFloat(getComputedStyle(this.$el).getPropertyValue(PLAYERS_TABLE_ZOOM_VARIABLE)) || 1);
      this.availableWidth = Math.floor(entries[0].contentRect.width * zoom);
    });
    this.resizeObserver.observe(this.$el);
  },
  beforeUnmount() {
    this.resizeObserver?.disconnect();
  },
  computed: {
    // Escape Velocity: rows get a clock line and a wider name column
    escapeVelocity(): boolean {
      return this.playerView.game.gameOptions.escapeVelocity !== undefined;
    },
    // Computed once per player color; every row has an entry
    tagDetailsByColor(): Record<string, TagDetails> {
      return Object.fromEntries(this.rows.map((row) => [row.player.color, buildTagDetails(row.player, this.playerView)]));
    },
    // Only tags at least one player has (or a discount or substitution on) – otherwise hidden for everyone
    tagColumns(): TagColumnGroups {
      const groups: TagColumnGroups = [[]];
      for (const tag of TAG_ORDER) {
        if (tag === 'separator') {
          groups.push([]);
          continue;
        }
        if (tag === 'all' || !isTagInGame(tag, this.playerView.game)) {
          continue;
        }
        const anyoneHasIt = Object.values(this.tagDetailsByColor).some((details) => {
          const detail = details.tagsInOrder.find((entry) => entry.name === tag);
          return detail !== undefined && (detail.count > 0 || detail.discount > 0 || detail.substitution !== undefined);
        });
        if (anyoneHasIt) {
          groups[groups.length - 1].push(tag);
        }
      }
      return groups.filter((group) => group.length > 0);
    },
    // Widest name and status plaque at scale 1, computed from the names alone – never measured in the page,
    // so the size can't feed back into itself (a measured width changes the scale, which changes the width …)
    nameWidths(): NameWidths {
      return {name: Math.max(0, ...this.rows.map((row) => textWidth(row.player.name, 22) + 4)), status: STATUS_PLAQUE_WIDTH};
    },
    // Widest goods box content at scale 1 from the values (not measured, see nameWidths): how far the boost may go
    goodsContentWidth(): number {
      return Math.max(0, ...this.rows.flatMap((row) => playerGoods(row.player).map(goodsTextWidth)));
    },
    fit(): PlayersTableFit {
      return fitPlayersTable(this.availableWidth, this.tagColumns, this.escapeVelocity, this.nameWidths);
    },
    tableClasses(): Array<string> {
      const classes = ['players-table', 'players-table--' + this.fit.mode];
      if (!this.fit.showCorporation) {
        classes.push('players-table--compact-name');
      }
      if (this.escapeVelocity) {
        classes.push('players-table--escape-velocity');
      }
      return classes;
    },
    tracks(): RowTracks {
      return rowTracks(this.rows.map((row) => row.player.color === this.playerView.thisPlayer?.color));
    },
    variables(): Record<string, string> {
      return tableVariables(this.fit, this.tagColumns, this.escapeVelocity, this.nameWidths, this.availableWidth, this.goodsContentWidth);
    },
    // Per resource the player with the sole highest production; nobody on a tie
    productionLeadersByColor(): Partial<Record<Color, Array<Resource>>> {
      const leaders: Partial<Record<Color, Array<Resource>>> = {};
      const goodsByColor = this.rows.map((row) => ({color: row.player.color, goods: playerGoods(row.player)}));
      if (goodsByColor.length < 2) {
        return leaders;
      }
      goodsByColor[0].goods.forEach((good, index) => {
        const productions = goodsByColor.map((entry) => entry.goods[index].production);
        const highest = Math.max(...productions);
        const holders = goodsByColor.filter((entry) => entry.goods[index].production === highest);
        if (highest > 0 && holders.length === 1) {
          (leaders[holders[0].color] ??= []).push(good.type);
        }
      });
      return leaders;
    },
  },
});
</script>
