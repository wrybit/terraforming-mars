<template>
  <!-- Meilenstein/Auszeichnung als Bild-Kacheln wie auf dem Brett; die gewählte pulsiert in der CTA-Farbe -->
  <div :class="['ma-options', 'choice-block', kind]" :style="choiceBlockStyle(options.length)" role="radiogroup">
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
import {PlayerInputModel} from '@/common/models/PlayerInputModel';
import {MilestoneAwardKind, milestoneAwardImageClass} from '@/client/components/milestoneAwardChoice';
import {choiceBlockStyle} from '@/client/components/choiceBlock';

defineProps<{
  kind: MilestoneAwardKind;
  options: ReadonlyArray<PlayerInputModel>;
  selected: PlayerInputModel | undefined;
  groupName: string;
}>();

defineEmits<{
  (event: 'select', option: PlayerInputModel): void;
}>();

// Die Unteroptionen tragen den Namen des Meilensteins bzw. der Auszeichnung als Titel
function optionName(option: PlayerInputModel): string {
  return typeof option.title === 'string' ? option.title : option.title.message;
}
</script>
