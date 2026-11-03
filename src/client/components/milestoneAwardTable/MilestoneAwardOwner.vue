<template>
  <span :class="['ma-table-owner', 'ma-table-owner--' + color]" v-glass-tooltip="playerName" v-flash="flashKey"><PlayerCube class="ma-table-cube" :color="color" view="slight" :size="13" /><span class="ma-table-owner-name">{{ playerName }}</span></span>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {Color} from '@/common/Color';
import PlayerCube from '@/client/components/common/PlayerCube.vue';
import {glassTooltip} from '@/client/directives/GlassTooltip';
import {vFlash} from '@/client/directives/ChangeFlash';

// Who claimed a milestone or funded an award: cube + name, the same tag for both (milestone_award_table.less).
// headerFit.ts drops the name (the tooltip keeps it) when the column is too narrow.
// Single root element (no comment in the template), so class and data-test from the table land on the tag.
export default defineComponent({
  name: 'MilestoneAwardOwner',
  components: {
    PlayerCube,
  },
  directives: {
    flash: vFlash,
    glassTooltip,
  },
  props: {
    color: {
      type: String as () => Color,
      required: true,
    },
    playerName: {
      type: String,
      default: '',
    },
    // Key of the change flash (changeFlashKeys.ts): the tag lights up when the claim or funding is new
    flashKey: {
      type: String,
      required: true,
    },
  },
});
</script>
