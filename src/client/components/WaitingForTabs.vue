<template>
  <!-- Jede Eingabe, die kein Aktionsmenü ist (Karten kaufen, Draft, Auswahl …), im Tab-Container:
       Handkarten-Tab (grau, nur Ansicht) und ein aktiver Tab für die Eingabe; deren Frage steht oben in der Box.
       Das Aktionsmenü (OrOptions) baut seine Tabs selbst, siehe orOptionsLayout.ts. -->
  <div class="wf-options wf-options--tabs">
    <div class="or-tabs" role="tablist">
      <HandCardsTab :count="handCards.length" :active="handTabActive" @select="handTabActive = true"/>
      <button type="button" role="tab"
        :title="$t(fullTabTitle(playerinput.title))"
        :aria-selected="!handTabActive"
        :class="['or-tab', {'or-tab--active': !handTabActive}, tone !== undefined ? 'or-tab--tone-' + tone : '']"
        @click="handTabActive = false">
        <span class="or-tab-title">{{ $t(inputTabLabel(playerinput)) }}</span>
        <span v-if="count !== undefined" class="or-tab-count">{{ count }}</span>
      </button>
    </div>

    <div v-docked-tab :class="['or-tab-panel', handTabActive ? 'or-tab-panel--view' : (tone !== undefined ? 'or-tab-panel--tone-' + tone : '')]" role="tabpanel">
      <SortableCards v-if="handTabActive" :playerId="playerView.id" :cards="handCards"/>
      <!-- Die Frage gehört zur Eingabe und steht daher in ihrer Box, nicht über den Tabs -->
      <label v-show="!handTabActive" class="or-tab-panel-title"><div>{{ $t(fullTabTitle(playerinput.title)) }}</div></label>
      <!-- v-show statt v-if: Eingaben bleiben beim Blick in die Hand erhalten -->
      <PlayerInputFactory v-show="!handTabActive"
        :players="playerView.players"
        :playerView="playerView"
        :playerinput="playerinput"
        :onsave="onsave"
        :showsave="true"
        :showtitle="false"/>
      <!-- Klebender Fußbereich unten an der Box (tabPanelFooter.ts); Bezahlbereiche hängen sich per Teleport ein -->
      <div v-show="!handTabActive" :id="footerId" class="or-tab-footer"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed, provide, ref} from 'vue';
import {vDockedTab} from '@/client/directives/DockedTab';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import {PlayerInputModel} from '@/common/models/PlayerInputModel';
import {InputResponse} from '@/common/inputs/InputResponse';
import HandCardsTab from '@/client/components/HandCardsTab.vue';
import SortableCards from '@/client/components/SortableCards.vue';
import {OR_OPTIONS_AS_TABS} from '@/client/components/orOptionsLayout';
import {TAB_PANEL_FOOTER, newTabPanelFooterId} from '@/client/components/tabPanelFooter';
import {fullTabTitle, inputTabLabel} from '@/client/components/orOptionsShortLabels';
import {inputAvailableCount} from '@/client/components/inputAvailableCount';
import {inputTone} from '@/client/components/inputTone';
import {allCardsInHand} from '@/client/utils/handCards';

const props = defineProps<{
  playerView: PlayerViewModel;
  playerinput: PlayerInputModel;
  onsave: (out: InputResponse) => void;
}>();

// Verschachtelte Auswahlen in der Eingabe bleiben Radio-Listen, keine zweite Tab-Leiste
provide(OR_OPTIONS_AS_TABS, false);
const footerId = newTabPanelFooterId();
provide(TAB_PANEL_FOOTER, '#' + footerId);

const handTabActive = ref(false);
const handCards = computed(() => allCardsInHand(props.playerView));
const count = computed(() => inputAvailableCount(props.playerinput));
// Farbton des Eingabe-Tabs (Präludium rosa, Angriff rot, Karten orange …)
const tone = computed(() => inputTone(props.playerinput));
</script>
