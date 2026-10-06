<template>
  <!-- Party choice the server offers as plain options (partyChoice.ts): the same cards as SelectParty -->
  <div class="select-party select-party--options" role="radiogroup">
    <div class="select-party__cards" :style="{'--party-columns': Math.min(6, cards.length)}">
      <PartyCard v-for="card in cards" :key="card.index"
        :party="partyModel(card)"
        :turmoil="turmoil"
        :selected="options[card.index] === selected"
        :groupName="groupName"
        :note="card.stays ? 'Stays here' : undefined"
        :policyText="card.policyText"
        :bonusText="card.bonusText"
        @select="pick(card)"/>
    </div>
  </div>
</template>

<script setup lang="ts">
import {onBeforeUnmount, onMounted} from 'vue';
import {PlayerInputModel} from '@/common/models/PlayerInputModel';
import {PartyModel, TurmoilModel} from '@/common/models/TurmoilModel';
import PartyCard from '@/client/components/turmoil/PartyCard.vue';
import {PartyChoiceOption} from '@/client/components/turmoil/partyChoice';
import {turmoilPickState} from '@/client/components/turmoil/turmoilView';
import {focusTurmoilBoard} from '@/client/components/turmoil/turmoilFocus';

const props = defineProps<{
  cards: ReadonlyArray<PartyChoiceOption>;
  options: ReadonlyArray<PlayerInputModel>;
  selected: PlayerInputModel | undefined;
  groupName: string;
  turmoil: TurmoilModel;
}>();

const emit = defineEmits<{
  (event: 'select', option: PlayerInputModel): void;
}>();

// Party without a model (should not happen) still gets a card with empty seats
function partyModel(card: PartyChoiceOption): PartyModel {
  return props.turmoil.parties.find((party) => party.name === card.party) ?? {name: card.party, partyLeader: undefined, delegates: []};
}

function pick(card: PartyChoiceOption) {
  turmoilPickState.pick = card.party;
  emit('select', props.options[card.index]);
}

let restoreBoard: (() => void) | undefined;
onMounted(() => {
  restoreBoard = focusTurmoilBoard();
});
onBeforeUnmount(() => restoreBoard?.());
</script>
