<template>
  <!-- One party as a card: badge, leader and seats, rules while ruling and when taking over.
       Shared by every party choice (SelectParty.vue, PartyOptions.vue) so they look alike. -->
  <label :class="['select-party__card', {'select-party__card--on': selected, 'select-party__card--off': disabled}]"
    :style="{'--party': PARTY_COLOR[party.name]}"
    :data-test="'party-' + party.name">
    <input type="radio" class="choice-option-input" :name="groupName" :checked="selected" :disabled="disabled" @change="emit('select')">
    <span class="select-party__badge"><span class="select-party__hex"><img :src="partyImage(party.name)" alt=""></span></span>
    <span v-if="party.name === turmoil.dominant" class="select-party__dominance" :title="$t('Dominant')"></span>
    <span class="select-party__name">{{ $t(party.name) }}</span>
    <span class="select-party__leader" :title="$t('Party leader')">
      <img v-if="party.partyLeader !== undefined" :src="figureImage(party.partyLeader)" width="26" :height="26 * 1.3" alt="">
      <span v-else class="select-party__seat" :style="{backgroundImage: 'url(' + figureImage(undefined) + ')'}"></span>
    </span>
    <span class="select-party__seats">
      <img v-for="(color, index) in seatedDelegates(party)" :key="index" :src="figureImage(color)" width="18" :height="18 * 1.3" alt="">
    </span>
    <span class="select-party__rule select-party__rule--policy"><small>{{ $t('While ruling') }}</small>{{ policyText ?? $t(agendaText(agenda.policy)) }}</span>
    <span class="select-party__rule select-party__rule--bonus"><small>{{ $t('When taking over') }}</small>{{ bonusText ?? $t(agendaText(agenda.bonus)) }}</span>
    <span v-if="note !== undefined" class="select-party__ruling">{{ $t(note) }}</span>
    <span v-else-if="party.name === turmoil.ruling" class="select-party__ruling">{{ $t('Ruling') }}</span>
  </label>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import {PartyModel, TurmoilModel} from '@/common/models/TurmoilModel';
import {PARTY_COLOR, PartyAgenda, agendaText, figureImage, partyAgenda, partyImage, seatedDelegates} from '@/client/components/turmoil/turmoilView';

const props = defineProps<{
  party: PartyModel;
  turmoil: TurmoilModel;
  selected: boolean;
  disabled?: boolean;
  groupName?: string;
  // Badge instead of "Ruling" (e.g. "Stays here" for the delegate's current party)
  note?: string;
  // Rules named by the server itself (Mars Frontier Alliance); otherwise the party's current agenda
  policyText?: string;
  bonusText?: string;
}>();

const emit = defineEmits<{
  (event: 'select'): void;
}>();

const agenda = computed((): PartyAgenda => partyAgenda(props.turmoil, props.party.name));
</script>
