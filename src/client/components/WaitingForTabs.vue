<template>
  <!-- Jede Eingabe, die kein Aktionsmenü ist (Karten kaufen, Draft, Auswahl …), im Tab-Container:
       Titel darüber, Handkarten-Tab (grau, nur Ansicht) und ein aktiver Tab für die Eingabe selbst.
       Das Aktionsmenü (OrOptions) baut seine Tabs selbst, siehe orOptionsLayout.ts. -->
  <div class="wf-options wf-options--tabs">
    <label><div>{{ $t(fullTabTitle(playerinput.title)) }}</div></label>

    <div class="or-tabs" role="tablist">
      <HandCardsTab :count="handCards.length" :active="handTabActive" @select="handTabActive = true"/>
      <button type="button" role="tab"
        :title="$t(fullTabTitle(playerinput.title))"
        :aria-selected="!handTabActive"
        :class="['or-tab', {'or-tab--active': !handTabActive}]"
        @click="handTabActive = false">
        <span class="or-tab-title">{{ $t(inputTabLabel(playerinput)) }}</span>
        <span v-if="count !== undefined" class="or-tab-count">{{ count }}</span>
      </button>
    </div>

    <div :class="['or-tab-panel', {'or-tab-panel--hand': handTabActive}]" role="tabpanel">
      <SortableCards v-if="handTabActive" :playerId="playerView.id" :cards="handCards"/>
      <!-- v-show statt v-if: Eingaben bleiben beim Blick in die Hand erhalten; Titel steht bereits oben -->
      <PlayerInputFactory v-show="!handTabActive"
        :players="playerView.players"
        :playerView="playerView"
        :playerinput="playerinput"
        :onsave="onsave"
        :showsave="true"
        :showtitle="false"/>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed, provide, ref} from 'vue';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import {PlayerInputModel} from '@/common/models/PlayerInputModel';
import {InputResponse} from '@/common/inputs/InputResponse';
import HandCardsTab from '@/client/components/HandCardsTab.vue';
import SortableCards from '@/client/components/SortableCards.vue';
import {OR_OPTIONS_AS_TABS} from '@/client/components/orOptionsLayout';
import {fullTabTitle, inputTabLabel} from '@/client/components/orOptionsShortLabels';
import {inputAvailableCount} from '@/client/components/inputAvailableCount';
import {allCardsInHand} from '@/client/utils/handCards';

const props = defineProps<{
  playerView: PlayerViewModel;
  playerinput: PlayerInputModel;
  onsave: (out: InputResponse) => void;
}>();

// Verschachtelte Auswahlen in der Eingabe bleiben Radio-Listen, keine zweite Tab-Leiste
provide(OR_OPTIONS_AS_TABS, false);

const handTabActive = ref(false);
const handCards = computed(() => allCardsInHand(props.playerView));
const count = computed(() => inputAvailableCount(props.playerinput));
</script>
