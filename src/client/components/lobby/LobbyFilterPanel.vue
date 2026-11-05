<template>
  <!-- Filters of the lobby list, closed at first; nothing selected means all games -->
  <div class="lobby-filters">
    <div class="lobby-filter-group">
      <div class="create-game-subhead" v-i18n>Players</div>
      <div class="lobby-filter-chips">
        <ChoiceChip v-for="size in SIZES" :key="size" :label="size === 2 ? '1 vs 1' : String(size)"
          :selected="modelValue.sizes.includes(size)" @select="toggleSize(size)" />
      </div>
    </div>
    <div class="lobby-filter-group">
      <div class="create-game-subhead" v-i18n>Pace</div>
      <SegmentedControl :class="{'lobby-segmented--any': modelValue.tempo === 'any'}" :modelValue="modelValue.tempo" :options="TEMPO_OPTIONS" @update:modelValue="update({tempo: $event})" />
    </div>
    <div class="lobby-filter-group">
      <div class="create-game-subhead" v-i18n>Draft</div>
      <SegmentedControl :class="{'lobby-segmented--any': modelValue.draft === 'any'}" :modelValue="modelValue.draft" :options="DRAFT_OPTIONS" @update:modelValue="update({draft: $event})" />
    </div>
    <div class="lobby-filter-group lobby-filter-group--wide">
      <div class="create-game-subhead" v-i18n>Must include</div>
      <div class="lobby-filter-chips">
        <ChoiceChip v-for="choice in OFFICIAL_EXPANSIONS" :key="choice.expansion" :label="choice.label" :iconClass="choice.iconClass"
          :selected="modelValue.expansions.includes(choice.expansion)" @select="toggleExpansion(choice.expansion)" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {Expansion} from '@/common/cards/GameModule';
import ChoiceChip from '@/client/components/create/ChoiceChip.vue';
import SegmentedControl from '@/client/components/create/SegmentedControl.vue';
import {OFFICIAL_EXPANSIONS, SegmentOption} from '@/client/components/create/createGameChoices';
import {LobbyFilters} from './lobbyFilters';

const props = defineProps<{
  modelValue: LobbyFilters;
}>();

const emit = defineEmits<{
  (event: 'update:modelValue', value: LobbyFilters): void;
}>();

const SIZES = [2, 3, 4, 5];
// "Any" is the resting state: selected, but in the quiet style (lobby.less), not the accent color
const TEMPO_OPTIONS: ReadonlyArray<SegmentOption> = [{value: 'any', label: 'Any'}, {value: 'normal', label: 'Normal'}, {value: 'fast', label: 'Fast mode'}];
const DRAFT_OPTIONS: ReadonlyArray<SegmentOption> = [{value: 'any', label: 'Any'}, {value: 'on', label: 'With'}, {value: 'off', label: 'Without'}];

function update(change: Partial<LobbyFilters>): void {
  emit('update:modelValue', {...props.modelValue, ...change});
}

function toggleSize(size: number): void {
  const sizes = props.modelValue.sizes.includes(size) ? props.modelValue.sizes.filter((s) => s !== size) : [...props.modelValue.sizes, size];
  update({sizes});
}

function toggleExpansion(expansion: Expansion): void {
  const current = props.modelValue.expansions;
  update({expansions: current.includes(expansion) ? current.filter((e) => e !== expansion) : [...current, expansion]});
}
</script>
