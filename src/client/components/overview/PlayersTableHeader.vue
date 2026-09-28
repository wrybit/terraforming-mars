<template>
  <div class="players-table-row players-table-head">
    <!-- Schalter vorne, auf Höhe der Icons: blenden Waren / Tags / Wertung ein und aus -->
    <div class="players-table-toggles">
      <button v-for="section in sections" :key="section.key" type="button"
        :class="['players-table-toggle', 'tooltip', 'tooltip-bottom']"
        :aria-pressed="visibility[section.key] ? 'true' : 'false'"
        :aria-label="$t(section.label)"
        :data-tooltip="$t(section.label)"
        :data-test="'toggle-' + section.key"
        @click="$emit('toggle', section.key)">
        <span :class="section.iconClass"></span>
      </button>
    </div>

    <template v-if="visibility.goods">
      <div class="players-table-divider"></div>
      <div class="players-table-cell" v-for="type in resources" :key="type">
        <span :class="'resource_icon resource_icon--' + type"></span>
      </div>
    </template>

    <template v-if="visibility.tags">
      <div class="players-table-divider"></div>
      <template v-for="(group, groupIndex) in tagColumns" :key="groupIndex">
        <div v-if="groupIndex > 0"></div>
        <div class="players-table-cell" v-for="tag in group" :key="tag" :data-test="'tag-head-' + tag">
          <Tag :tag="(tag as CardTag)" size="big" type="secondary"/>
        </div>
      </template>
    </template>

    <template v-if="visibility.score">
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

    <div class="players-table-divider"></div>
    <div class="players-table-cell players-table-head-label" v-i18n>Cards</div>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import Tag from '@/client/components/Tag.vue';
import {Tag as CardTag} from '@/common/cards/Tag';
import {ALL_RESOURCES} from '@/common/Resource';
import {SectionVisibility, TableSection, TagColumnGroups} from '@/client/components/overview/playersTableLayout';

type SectionToggle = {key: TableSection; label: string; iconClass: string};

// Icon je Schalter: typisches Symbol des Abschnitts
const SECTION_TOGGLES: Array<SectionToggle> = [
  {key: 'goods', label: 'Goods', iconClass: 'resource_icon resource_icon--megacredits'},
  {key: 'tags', label: 'Tags', iconClass: 'tag-count tag-building tag-type-secondary'},
  {key: 'score', label: 'Scoring', iconClass: 'tag-count tag-vp tag-type-main'},
];

export default defineComponent({
  name: 'PlayersTableHeader',
  components: {
    Tag,
  },
  props: {
    visibility: {
      type: Object as () => SectionVisibility,
      required: true,
    },
    tagColumns: {
      type: Array as () => TagColumnGroups,
      required: true,
    },
  },
  emits: ['toggle'],
  computed: {
    sections(): Array<SectionToggle> {
      return SECTION_TOGGLES;
    },
    resources(): typeof ALL_RESOURCES {
      return ALL_RESOURCES;
    },
  },
});
</script>
