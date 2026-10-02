<template>
  <a v-if="kind === 'player'" :href="href" data-stats-link class="stats-player" :class="`player_translucent_bg_color_${color}`">{{ name }}</a>
  <a v-else :href="href" data-stats-link class="stats-entity">
    <MilestoneAwardIcon v-if="iconParts !== undefined" class="stats-entity-icon" :parts="iconParts"/>
    <span v-i18n>{{ label }}</span>
  </a>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {Color} from '@/common/Color';
import {MilestoneName} from '@/common/ma/MilestoneName';
import {AwardName} from '@/common/ma/AwardName';
import {AWARD_ICONS, IconPart, MILESTONE_ICONS} from '@/client/components/milestoneAwardTable/milestoneAwardIcons';
import MilestoneAwardIcon from '@/client/components/milestoneAwardTable/MilestoneAwardIcon.vue';
import {StatsKind} from './statsKinds';
import {statsHref} from './statsNavigation';
import {boardLabel} from './statsLabels';

// Name eines Eintrags als Link zur Detailseite; Spieler in ihrer Spielerfarbe, Meilensteine/Auszeichnungen mit Symbol
export default defineComponent({
  name: 'StatsEntityName',
  components: {MilestoneAwardIcon},
  inject: {
    playerColors: {default: () => new Map<string, Color>()},
  },
  props: {
    kind: {type: String as PropType<StatsKind>, required: true},
    name: {type: String, required: true},
  },
  computed: {
    href(): string {
      return statsHref({type: 'detail', kind: this.kind, name: this.name});
    },
    label(): string {
      return this.kind === 'board' ? boardLabel(this.name) : this.name;
    },
    color(): Color {
      return (this.playerColors as Map<string, Color>).get(this.name) ?? 'neutral';
    },
    iconParts(): ReadonlyArray<IconPart> | undefined {
      if (this.kind === 'milestone') {
        return MILESTONE_ICONS[this.name as MilestoneName];
      }
      if (this.kind === 'award') {
        return AWARD_ICONS[this.name as AwardName];
      }
      return undefined;
    },
  },
});
</script>
