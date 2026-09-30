<template>
  <div class="players-table" :style="{'--players-table-columns': template, '--players-table-cell-count': cellCount}">
    <!-- Spielerliste als Tabelle (nur im Zwei-Spalten-Layout sichtbar, siehe players_table.less) -->
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
import {mobileLayout} from '@/client/utils/mobileLayout';
import {
  DESKTOP_SECTION_ORDER, GOODS_COUNT, MOBILE_SECTION_ORDER, SCORE_COUNT, PlayersTableRowModel, SectionVisibility, TableSection, TagColumnGroups,
  FittedVisibility, columnTemplate, fitToWidth, loadPreferredSection, loadSectionVisibility, savePreferredSection, saveSectionVisibility,
} from '@/client/components/overview/playersTableLayout';

type DataModel = {
  visibility: SectionVisibility;
  // Zuletzt eingeschalteter Abschnitt – bleibt bei Platzmangel am längsten sichtbar
  preferredSection: TableSection | undefined;
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
      preferredSection: loadPreferredSection(),
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
      // Mobil-Ansicht bricht die Zeilen um (mobile.less), dort muss kein Abschnitt aus Platzgründen weichen
      return fitToWidth(wanted, this.tagColumns, mobileLayout.value ? 0 : this.availableWidth, this.preferredSection);
    },
    effectiveVisibility(): SectionVisibility {
      return this.fitted.visibility;
    },
    // Zellen je Zeile ohne Trenner (Name, Waren, Tags samt Gruppen-Lücken, Wertung, Karten);
    // die Mobil-Ansicht dreht die Tabelle damit um (mobile.less: Spieler als Spalten)
    sectionOrder(): ReadonlyArray<TableSection> {
      return mobileLayout.value ? MOBILE_SECTION_ORDER : DESKTOP_SECTION_ORDER;
    },
    cellCount(): number {
      const visibility = this.effectiveVisibility;
      const tagCells = this.tagColumns.reduce((sum, group) => sum + group.length, 0) + Math.max(0, this.tagColumns.length - 1);
      return 1 + (visibility.goods ? GOODS_COUNT : 0) + (visibility.tags ? tagCells : 0) + (visibility.score ? SCORE_COUNT : 0) + 1;
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
    // Ein nur aus Platzgründen ausgeblendeter Abschnitt wird bevorzugt (ein anderer macht Platz), statt ihn abzuschalten
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
