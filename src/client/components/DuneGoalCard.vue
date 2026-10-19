<template>
  <!-- Dune theme: a milestone or award as a goal card of the mockup (goals page) instead of the Mars board tile:
       parchment, gold frame for milestones and blue for awards, name, symbol strip with amounts, goal, story, model -->
  <div :class="['dune-goal-card', 'dune-goal-card--' + kind]">
    <h4 class="dune-goal-card__name">{{ $t(name) }}</h4>
    <div class="dune-goal-card__icons">
      <span v-if="strip !== undefined" class="dune-goal-card__strip" data-test="goal-strip">
        <template v-for="(item, index) in strip" :key="index">
          <span v-if="'plus' in item" class="dune-goal-card__plus">+</span>
          <template v-else>
            <span v-if="item.count !== undefined" class="dune-goal-card__count">{{ item.count }}</span>
            <span v-for="copy in item.repeat ?? 1" :key="copy" :class="{'dune-goal-card__production': item.production}">
              <img class="dune-goal-card__symbol" :src="picture(item.asset)" alt="">
            </span>
          </template>
        </template>
      </span>
      <MilestoneAwardIcon v-else :parts="parts"/>
    </div>
    <p v-if="description !== ''" class="dune-goal-card__goal">{{ $t(description) }}</p>
    <p v-if="flavor !== undefined" class="dune-goal-card__flavor">{{ flavor }}</p>
    <!-- Which Mars goal it stands for, as on the mockup cards: the Mars name, not the Dune one -->
    <p class="dune-goal-card__model">{{ modelText }}</p>
  </div>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import MilestoneAwardIcon from '@/client/components/milestoneAwardTable/MilestoneAwardIcon.vue';
import {AWARD_ICONS, IconPart, MILESTONE_ICONS} from '@/client/components/milestoneAwardTable/milestoneAwardIcons';
import {MilestoneAwardKind} from '@/client/components/milestoneAwardChoice';
import {getAward, getMilestone} from '@/client/MilestoneAwardManifest';
import {themedAsset, themedGoalIcon} from '@/client/theme/themeDisplay';
import {duneGoalStrip, GoalStripItem} from '@/client/theme/duneGoalStrip';
import {translateText} from '@/client/directives/i18n';
import {AwardName} from '@/common/ma/AwardName';
import {MilestoneName} from '@/common/ma/MilestoneName';

const props = defineProps<{
  kind: MilestoneAwardKind;
  name: string;
}>();

const strip = computed((): ReadonlyArray<GoalStripItem> | undefined => duneGoalStrip(props.name));

const parts = computed((): ReadonlyArray<IconPart> => {
  const mars = props.kind === 'milestones' ? MILESTONE_ICONS[props.name as MilestoneName] : AWARD_ICONS[props.name as AwardName];
  return themedGoalIcon(props.name, mars ?? []) as ReadonlyArray<IconPart>;
});

// Story line of the goal from the theme texts (src/themes/dune/names: "flavor:<goal>"), as on the mockup cards
const flavor = computed((): string | undefined => window._themeTranslations?.['flavor:' + props.name]);

// Mars name in the current language, past the theme texts (which would give the Dune name again)
const modelText = computed((): string => {
  const translations: {[key: string]: string} | undefined = (window as any)._translations;
  // Placeholder filled by hand: translateTextWithParams would run the name through the theme texts again
  return translateText('Based on: ${0}').replace('${0}', translations?.[props.name] ?? props.name);
});

const description = computed((): string => {
  const goal = props.kind === 'milestones' ? getMilestone(props.name as MilestoneName) : getAward(props.name as AwardName);
  return goal?.description ?? '';
});

function picture(asset: string): string {
  return themedAsset(`assets/${asset}.png`);
}
</script>
