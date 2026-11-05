<template>
  <!-- Filters of the lobby list, closed at first; nothing selected means all games.
       Only filters that match at least one open game (availableFilterChoices) -->
  <div v-if="hasChoices" class="lobby-filters">
    <div v-if="choices.sizes.length > 0" class="lobby-filter-group">
      <div class="create-game-subhead" v-i18n>Players</div>
      <div class="lobby-filter-chips">
        <ChoiceChip v-for="size in choices.sizes" :key="size" :label="size === 2 ? '1 vs 1' : String(size)"
          :selected="modelValue.sizes.includes(size)" @select="toggleSize(size)" />
      </div>
    </div>
    <div v-if="choices.tempos.length > 0" class="lobby-filter-group">
      <div class="create-game-subhead" v-i18n>Pace</div>
      <SegmentedControl :class="{'lobby-segmented--any': modelValue.tempo === 'any'}" :modelValue="modelValue.tempo" :options="tempoOptions" @update:modelValue="update({tempo: $event})" />
    </div>
    <div v-if="choices.drafts.length > 0" class="lobby-filter-group">
      <div class="create-game-subhead" v-i18n>Draft</div>
      <SegmentedControl :class="{'lobby-segmented--any': modelValue.draft === 'any'}" :modelValue="modelValue.draft" :options="draftOptions" @update:modelValue="update({draft: $event})" />
    </div>
    <div v-if="expansionChoices.length > 0" class="lobby-filter-group lobby-filter-group--wide">
      <div class="create-game-subhead" v-i18n>Must include</div>
      <div class="lobby-filter-chips">
        <ChoiceChip v-for="choice in expansionChoices" :key="choice.expansion" :label="choice.label" :iconClass="choice.iconClass"
          :selected="modelValue.expansions.includes(choice.expansion)" @select="toggleExpansion(choice.expansion)" />
      </div>
    </div>
  </div>
  <p v-else class="lobby-dialog-note" v-i18n>No open game to filter right now.</p>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import {Expansion} from '@/common/cards/GameModule';
import {LobbyRoomModel} from '@/common/lobby/LobbyModel';
import ChoiceChip from '@/client/components/create/ChoiceChip.vue';
import SegmentedControl from '@/client/components/create/SegmentedControl.vue';
import {FAN_EXPANSIONS, OFFICIAL_EXPANSIONS, SegmentOption} from '@/client/components/create/createGameChoices';
import {availableFilterChoices, LobbyFilters} from './lobbyFilters';

const props = defineProps<{
  modelValue: LobbyFilters;
  /** Every listed room; the choices come from the open ones with a free seat */
  rooms: ReadonlyArray<LobbyRoomModel>;
}>();

const emit = defineEmits<{
  (event: 'update:modelValue', value: LobbyFilters): void;
}>();

const EXPANSIONS = [...OFFICIAL_EXPANSIONS, ...FAN_EXPANSIONS];
// "Any" is the resting state: selected, but in the quiet style (lobby.less), not the accent color
const ANY: SegmentOption = {value: 'any', label: 'Any'};
const TEMPO_LABELS: Record<string, string> = {normal: 'Normal', fast: 'Fast mode'};
const DRAFT_LABELS: Record<string, string> = {on: 'With', off: 'Without'};

const choices = computed(() => availableFilterChoices(props.rooms, props.modelValue, EXPANSIONS.map((choice) => choice.expansion)));
const hasChoices = computed(() => choices.value.sizes.length + choices.value.tempos.length + choices.value.drafts.length + choices.value.expansions.length > 0);
const tempoOptions = computed<ReadonlyArray<SegmentOption>>(() => [ANY, ...choices.value.tempos.map((tempo) => ({value: tempo, label: TEMPO_LABELS[tempo]}))]);
const draftOptions = computed<ReadonlyArray<SegmentOption>>(() => [ANY, ...choices.value.drafts.map((draft) => ({value: draft, label: DRAFT_LABELS[draft]}))]);
const expansionChoices = computed(() => EXPANSIONS.filter((choice) => choices.value.expansions.includes(choice.expansion)));

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
