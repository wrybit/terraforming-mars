<template>
  <div class="players-table" :style="{'--players-table-columns': template}">
    <!-- Spielerliste als Tabelle (nur im Zwei-Spalten-Layout sichtbar, siehe players_table.less) -->
    <PlayersTableHeader :visibility="effectiveVisibility" :autoHidden="fitted.autoHidden" :tagColumns="tagColumns" @toggle="toggleSection"/>
    <div class="players-table-rows">
      <PlayersTableRow v-for="row in rows" :key="row.player.color"
        :player="row.player"
        :playerView="playerView"
        :firstForGen="row.firstForGen"
        :actionLabel="row.actionLabel"
        :playerIndex="row.playerIndex"
        :visibility="effectiveVisibility"
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
import {
  PlayersTableRowModel, SectionVisibility, TableSection, TagColumnGroups,
  FittedVisibility, columnTemplate, fitToWidth, loadSectionVisibility, saveSectionVisibility,
} from '@/client/components/overview/playersTableLayout';

type DataModel = {
  visibility: SectionVisibility;
  // Breite der Tabelle; 0, solange sie unsichtbar oder noch nicht gemessen ist
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
    // Reihenfolge wie in der klassischen Leiste: Mitspieler in Zugfolge, man selbst zuletzt
    rows: {
      type: Array as () => Array<PlayersTableRowModel>,
      required: true,
    },
  },
  data(): DataModel {
    return {
      visibility: loadSectionVisibility(),
      availableWidth: 0,
      resizeObserver: undefined,
    };
  },
  // Spaltenbreite beobachten: in schmalen Fenstern fallen Abschnitte automatisch weg, statt abgeschnitten zu werden
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
    // Je Spielerfarbe einmal berechnet; jede Zeile hat einen Eintrag
    tagDetailsByColor(): Record<string, TagDetails> {
      return Object.fromEntries(this.rows.map((row) => [row.player.color, buildTagDetails(row.player, this.playerView)]));
    },
    // Nur Tags, die mindestens ein Spieler hat (oder auf die jemand Rabatt bekommt) – sonst für alle ausgeblendet
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
    // Tags-Abschnitt entfällt, wenn es keine einzige Tag-Spalte gibt; zu Breites fällt nach Vorrang weg
    fitted(): FittedVisibility {
      const wanted = {...this.visibility, tags: this.visibility.tags && this.tagColumns.length > 0};
      return fitToWidth(wanted, this.tagColumns, this.availableWidth);
    },
    effectiveVisibility(): SectionVisibility {
      return this.fitted.visibility;
    },
    template(): string {
      return columnTemplate(this.effectiveVisibility, this.tagColumns);
    },
    // Pro Ware der Spieler mit der alleinigen höchsten Produktion; bei Gleichstand niemand
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
    toggleSection(section: TableSection) {
      this.visibility = {...this.visibility, [section]: !this.visibility[section]};
      saveSectionVisibility(this.visibility);
    },
  },
});
</script>
