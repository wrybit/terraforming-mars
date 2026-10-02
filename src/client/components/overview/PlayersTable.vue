<template>
  <div class="players-table" :style="{'--players-table-columns': template, '--players-table-cell-count': cellCount}">
    <!-- Player list as a table (only visible in the two-column layout, see players_table.less) -->
    <PlayersTableHeader :visibility="effectiveVisibility" :sectionOrder="sectionOrder" :autoHidden="fitted.autoHidden" :tagColumns="tagColumns" @toggle="toggleSection"/>
    <div class="players-table-rows">
      <PlayersTableRow v-for="row in rows" :key="row.player.color"
        :player="row.player"
        :playerView="playerView"
        :firstForGen="row.firstForGen"
        :actionLabel="row.actionLabel"
        :playerIndex="row.playerIndex"
        :visibility="effectiveVisibility"
        :sectionOrder="sectionOrder"
        :tagColumns="tagColumns"
        :tagDetails="tagDetailsByColor[row.player.color]"
        :productionLeaders="productionLeadersByColor[row.player.color] ?? []"/>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {ViewModel} from '@/common/models/PlayerModel';
import {Color} from '@/common/Color';
import {Resource} from '@/common/Resource';
import PlayersTableHeader from '@/client/components/overview/PlayersTableHeader.vue';
import PlayersTableRow from '@/client/components/overview/PlayersTableRow.vue';
import {TAG_ORDER, TagDetails, buildTagDetails, isTagInGame} from '@/client/components/overview/playerTagDetails';
import {playerGoods} from '@/client/components/overview/playerGoods';
import {mobileLandscape, mobileLayout} from '@/client/utils/mobileLayout';
import {
  DESKTOP_SECTION_ORDER, GOODS_COUNT, MOBILE_SECTION_ORDER, SCORE_COUNT, PlayersTableRowModel, SectionVisibility, TableSection, TagColumnGroups,
  FittedVisibility, columnTemplate, fitToWidth, loadPreferredSection, loadSectionVisibility, savePreferredSection, saveSectionVisibility,
} from '@/client/components/overview/playersTableLayout';

type DataModel = {
  visibility: SectionVisibility;
  // Most recently enabled section – stays visible longest when space is short
  preferredSection: TableSection | undefined;
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
      visibility: loadSectionVisibility(),
      preferredSection: loadPreferredSection(),
      availableWidth: 0,
      resizeObserver: undefined,
    };
  },
  // Watch the column width: in narrow windows sections drop out automatically instead of being clipped
  mounted() {
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    this.resizeObserver = new ResizeObserver((entries) => {
      this.availableWidth = Math.floor(entries[0].contentRect.width);
    });
    this.resizeObserver.observe(this.$el);
  },
  beforeUnmount() {
    this.resizeObserver?.disconnect();
  },
  computed: {
    // Mobile view except tablet landscape transposes the table (players as columns, mobile.less @mb-portrait)
    transposed(): boolean {
      return mobileLayout.value && !mobileLandscape.value;
    },
    // Computed once per player color; every row has an entry
    tagDetailsByColor(): Record<string, TagDetails> {
      return Object.fromEntries(this.rows.map((row) => [row.player.color, buildTagDetails(row.player, this.playerView)]));
    },
    // Only tags at least one player has (or someone gets a discount on) – otherwise hidden for everyone
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
          return detail !== undefined && (detail.count > 0 || detail.discount > 0);
        });
        if (anyoneHasIt) {
          groups[groups.length - 1].push(tag);
        }
      }
      return groups.filter((group) => group.length > 0);
    },
    // The tags section is dropped if there is not a single tag column; what's too wide drops out by priority
    fitted(): FittedVisibility {
      const wanted = {...this.visibility, tags: this.visibility.tags && this.tagColumns.length > 0};
      // The transposed table (mobile.less) grows downward, so no section has to give way for lack of space
      return fitToWidth(wanted, this.tagColumns, this.transposed ? 0 : this.availableWidth, this.preferredSection);
    },
    effectiveVisibility(): SectionVisibility {
      return this.fitted.visibility;
    },
    // Cells per row without separators (name, goods, tags incl. group gaps, scoring, cards);
    // the mobile view uses this to transpose the table (mobile.less: players as columns)
    sectionOrder(): ReadonlyArray<TableSection> {
      return this.transposed ? MOBILE_SECTION_ORDER : DESKTOP_SECTION_ORDER;
    },
    cellCount(): number {
      const visibility = this.effectiveVisibility;
      const tagCells = this.tagColumns.reduce((sum, group) => sum + group.length, 0) + Math.max(0, this.tagColumns.length - 1);
      return 1 + (visibility.goods ? GOODS_COUNT : 0) + (visibility.tags ? tagCells : 0) + (visibility.score ? SCORE_COUNT : 0) + 1;
    },
    template(): string {
      return columnTemplate(this.effectiveVisibility, this.tagColumns);
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
  methods: {
    // A section hidden only for lack of space gets preferred (another one makes room) instead of being turned off
    toggleSection(section: TableSection) {
      if (this.fitted.autoHidden.includes(section)) {
        this.preferredSection = section;
      } else {
        const turnedOn = !this.visibility[section];
        this.visibility = {...this.visibility, [section]: turnedOn};
        saveSectionVisibility(this.visibility);
        if (turnedOn) {
          this.preferredSection = section;
        }
      }
      savePreferredSection(this.preferredSection);
    },
  },
});
</script>
