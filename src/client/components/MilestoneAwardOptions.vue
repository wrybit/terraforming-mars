<template>
  <!-- Milestone/award as image tiles like on the board; the chosen one pulses in the CTA colour -->
  <div :class="['ma-options', 'choice-block', kind]" :style="choiceBlockStyle(options.length)" role="radiogroup">
    <!-- Header row with the zoom, in the same place as in every tab (card_zoom_slider.less scales the tiles) -->
    <CardZoomBar/>
    <label v-for="option in options" :key="optionName(option)"
      :class="['ma-block', 'ma-option', {'ma-option--selected': option === selected}]">
      <input type="radio" class="ma-option-input" :name="groupName" :checked="option === selected" @change="$emit('select', option)">
      <div :class="['ma-name', milestoneAwardImageClass(optionName(option))]">
        <span>{{ $t(optionName(option)) }}</span>
      </div>
    </label>
  </div>
</template>

<script setup lang="ts">
import {onBeforeUnmount, onMounted} from 'vue';
import {PlayerInputModel} from '@/common/models/PlayerInputModel';
import {MilestoneAwardKind, milestoneAwardImageClass, milestoneAwardOptionName} from '@/client/components/milestoneAwardChoice';
import CardZoomBar from '@/client/components/cardfilter/CardZoomBar.vue';
import {choiceBlockStyle} from '@/client/components/choiceBlock';
import {focusMilestonesAwards} from '@/client/components/logpanel/milestonesAwardsFocus';

defineProps<{
  kind: MilestoneAwardKind;
  options: ReadonlyArray<PlayerInputModel>;
  selected: PlayerInputModel | undefined;
  groupName: string;
}>();

defineEmits<{
  (event: 'select', option: PlayerInputModel): void;
}>();

const optionName = milestoneAwardOptionName;

// The log box shows the milestones & awards table while choosing (milestonesAwardsFocus.ts)
let releaseFocus: (() => void) | undefined;
onMounted(() => {
  releaseFocus = focusMilestonesAwards();
});
onBeforeUnmount(() => releaseFocus?.());
</script>
