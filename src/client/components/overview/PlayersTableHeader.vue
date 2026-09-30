<template>
  <div class="players-table-row players-table-head">
    <!-- Schalter vorne, auf Höhe der Icons: blenden Waren / Tags / Wertung ein und aus -->
    <div class="players-table-toggles">
      <button v-for="section in sections" :key="section.key" type="button"
        :class="['players-table-toggle', {'players-table-toggle--squeezed': autoHidden.includes(section.key)}]"
        :aria-pressed="visibility[section.key] ? 'true' : 'false'"
        :aria-label="$t(section.label)"
        v-glass-tooltip="autoHidden.includes(section.key) ? $t(section.label) + ': ' + $t('Not enough space') : $t(section.label)"
        :data-test="'toggle-' + section.key"
        @click="$emit('toggle', section.key)">
        <span :class="['players-table-toggle-icon', 'players-table-toggle-icon--' + section.icon]"></span>
      </button>
    </div>

    <!-- Reihenfolge der Abschnitte aus PlayersTable (Desktop: Waren, Tags, Wertung; mobil: Waren, Wertung, Tags) -->
    <template v-for="section in sectionOrder" :key="section">
      <template v-if="section === 'goods' && visibility.goods">
        <div class="players-table-divider"></div>
        <div class="players-table-cell" v-for="type in resources" :key="type">
          <span :class="'resource_icon resource_icon--' + type"></span>
        </div>
      </template>

      <template v-if="section === 'tags' && visibility.tags">
        <div class="players-table-divider"></div>
        <template v-for="(group, groupIndex) in tagColumns" :key="groupIndex">
          <div v-if="groupIndex > 0"></div>
          <div class="players-table-cell" v-for="tag in group" :key="tag" :data-test="'tag-head-' + tag">
            <Tag :tag="(tag as CardTag)" size="big" type="secondary"/>
          </div>
        </template>
      </template>

      <template v-if="section === 'score' && visibility.score">
        <div class="players-table-divider"></div>
        <div class="players-table-cell"><div class="tag-count tag-vp tag-type-main tooltip tooltip-bottom" :data-tooltip="$t('Victory Points')"></div></div>
        <div class="players-table-cell"><div class="tag-count tag-tr tag-type-main tooltip tooltip-bottom" :data-tooltip="$t('Terraform Rating')"></div></div>
        <div class="players-table-cell"><div class="tag-count tag-cards tag-type-main tooltip tooltip-bottom" :data-tooltip="$t('Cards in hand')"></div></div>
        <div class="players-table-cell">
          <div class="tag-count tag-action-card tooltip tooltip-bottom" :data-tooltip="$t('The number of available actions on active cards')">
            <div class="blue-stripe"></div>
            <div class="red-arrow"></div>
          </div>
        </div>
      </template>
    </template>

    <div class="players-table-divider"></div>
    <div class="players-table-cell players-table-head-label" v-i18n>Cards</div>
  </div>
</template>

<script lang="ts">
import {glassTooltip} from '@/client/directives/GlassTooltip';
import {defineComponent} from 'vue';
import Tag from '@/client/components/Tag.vue';
import {Tag as CardTag} from '@/common/cards/Tag';
import {ALL_RESOURCES} from '@/common/Resource';
import {DESKTOP_SECTION_ORDER, SectionVisibility, TableSection, TagColumnGroups} from '@/client/components/overview/playersTableLayout';

type SectionToggle = {key: TableSection; label: string; icon: 'megacredit' | 'building' | 'vp'};

// Icon je Schalter: typisches Symbol des Abschnitts
const SECTION_TOGGLES: Array<SectionToggle> = [
  {key: 'goods', label: 'Goods', icon: 'megacredit'},
  {key: 'tags', label: 'Tags', icon: 'building'},
  {key: 'score', label: 'Scoring', icon: 'vp'},
];

export default defineComponent({
  name: 'PlayersTableHeader',
  components: {
    Tag,
  },
  directives: {
    glassTooltip,
  },
  props: {
    visibility: {
      type: Object as () => SectionVisibility,
      required: true,
    },
    // Reihenfolge der Abschnitte (playersTableLayout.ts: sectionOrder)
    sectionOrder: {
      type: Array as () => ReadonlyArray<TableSection>,
      default: () => DESKTOP_SECTION_ORDER,
    },
    tagColumns: {
      type: Array as () => TagColumnGroups,
      required: true,
    },
    // Aus Platzgründen ausgeblendete Abschnitte: Schalter gestrichelt, ein Klick holt sie zurück
    autoHidden: {
      type: Array as () => Array<TableSection>,
      default: () => [],
    },
  },
  emits: ['toggle'],
  computed: {
    // Schalter in derselben Reihenfolge wie die Abschnitte (mobil: Waren, Wertung, Tags)
    sections(): Array<SectionToggle> {
      return this.sectionOrder.flatMap((key) => SECTION_TOGGLES.filter((toggle) => toggle.key === key));
    },
    resources(): typeof ALL_RESOURCES {
      return ALL_RESOURCES;
    },
  },
});
</script>
