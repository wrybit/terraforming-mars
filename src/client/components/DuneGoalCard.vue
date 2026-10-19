<template>
  <!-- Dune theme: a milestone or award as a goal card of the mockup (goals page) instead of the Mars board tile:
       parchment, gold frame for milestones and blue for awards, name, symbol strip, goal -->
  <div :class="['dune-goal-card', 'dune-goal-card--' + kind]">
    <h4 class="dune-goal-card__name">{{ $t(name) }}</h4>
    <div class="dune-goal-card__icons">
      <MilestoneAwardIcon :parts="parts"/>
    </div>
    <p v-if="description !== ''" class="dune-goal-card__goal">{{ $t(description) }}</p>
  </div>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import MilestoneAwardIcon from '@/client/components/milestoneAwardTable/MilestoneAwardIcon.vue';
import {AWARD_ICONS, IconPart, MILESTONE_ICONS} from '@/client/components/milestoneAwardTable/milestoneAwardIcons';
import {MilestoneAwardKind} from '@/client/components/milestoneAwardChoice';
import {getAward, getMilestone} from '@/client/MilestoneAwardManifest';
import {themedGoalIcon} from '@/client/theme/themeDisplay';
import {AwardName} from '@/common/ma/AwardName';
import {MilestoneName} from '@/common/ma/MilestoneName';

const props = defineProps<{
  kind: MilestoneAwardKind;
  name: string;
}>();

const parts = computed((): ReadonlyArray<IconPart> => {
  const mars = props.kind === 'milestones' ? MILESTONE_ICONS[props.name as MilestoneName] : AWARD_ICONS[props.name as AwardName];
  return themedGoalIcon(props.name, mars ?? []) as ReadonlyArray<IconPart>;
});

const description = computed((): string => {
  const goal = props.kind === 'milestones' ? getMilestone(props.name as MilestoneName) : getAward(props.name as AwardName);
  return goal?.description ?? '';
});
</script>
