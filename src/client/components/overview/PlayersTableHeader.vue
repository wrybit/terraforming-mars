<template>
  <div class="players-table-row players-table-head">
    <!-- Game menu in front (only in the player view, GameMenu.vue) -->
    <!-- Two lines: no own line for the menu, the burger alone sits at the left edge in front of the goods icons -->
    <div :class="['players-table-menu', {'players-table-menu--inline': mode === 'two-lines'}]"><GameMenu/></div>

    <!-- Column heads only where the cells have no icon of their own (one and two lines) -->
    <template v-if="mode === 'line' || mode === 'two-lines'">
      <div class="players-table-section players-table-section--goods">
        <div class="players-table-cell" v-for="type in resources" :key="type">
          <span :class="'resource_icon resource_icon--' + type"></span>
        </div>
      </div>

      <div class="players-table-section players-table-section--tags">
        <template v-for="(group, groupIndex) in tagColumns" :key="groupIndex">
          <div v-if="groupIndex > 0" class="players-table-tag-gap"></div>
          <div class="players-table-cell" v-for="tag in group" :key="tag" :data-test="'tag-head-' + tag">
            <Tag :tag="(tag as CardTag)" size="big" type="secondary"/>
          </div>
        </template>
      </div>

      <!-- Two lines: the score has its icons in the chips next to the name -->
      <div v-if="mode === 'line'" class="players-table-section players-table-section--score">
        <div class="players-table-cell"><ScoreIcon kind="vp"/></div>
        <div class="players-table-cell"><ScoreIcon kind="tr"/></div>
        <div class="players-table-cell"><ScoreIcon kind="hand"/></div>
        <div class="players-table-cell"><ScoreIcon kind="actions"/></div>
        <div class="players-table-cell players-table-head-label" v-i18n>Cards</div>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import Tag from '@/client/components/Tag.vue';
import GameMenu from '@/client/components/gameMenu/GameMenu.vue';
import ScoreIcon from '@/client/components/overview/ScoreIcon.vue';
import {Tag as CardTag} from '@/common/cards/Tag';
import {ALL_RESOURCES} from '@/common/Resource';
import {PlayersTableMode, TagColumnGroups} from '@/client/components/overview/playersTableLayout';

export default defineComponent({
  name: 'PlayersTableHeader',
  components: {
    Tag,
    GameMenu,
    ScoreIcon,
  },
  props: {
    mode: {
      type: String as () => PlayersTableMode,
      default: 'line',
    },
    tagColumns: {
      type: Array as () => TagColumnGroups,
      required: true,
    },
  },
  computed: {
    resources(): typeof ALL_RESOURCES {
      return ALL_RESOURCES;
    },
  },
});
</script>
