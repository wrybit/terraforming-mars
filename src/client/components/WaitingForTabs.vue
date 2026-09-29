<template>
  <!-- Jede Eingabe, die kein Aktionsmenü ist (Karten kaufen, Draft, Auswahl …), im Tab-Container:
       Handkarten-Tab (grau, nur Ansicht) und ein aktiver Tab für die Eingabe; deren Frage steht oben in der Box.
       Das Aktionsmenü (OrOptions) baut seine Tabs selbst, siehe orOptionsLayout.ts. -->
  <div class="wf-options wf-options--tabs">
    <div class="or-tabs" role="tablist">
      <HandCardsTab :count="handCards.length" :active="handTabActive" @select="handTabActive = true"/>
      <button type="button" role="tab"
        :title="$t(fullTabTitle(lead.title))"
        :aria-selected="!handTabActive"
        :class="['or-tab', {'or-tab--active': !handTabActive}, tone !== undefined ? 'or-tab--tone-' + tone : '']"
        @click="handTabActive = false">
        <span class="or-tab-title">{{ $t(inputTabLabel(lead)) }}</span>
        <span v-if="count !== undefined" class="or-tab-count">{{ count }}</span>
      </button>
    </div>

    <div v-docked-tab :class="['or-tab-panel', handTabActive ? 'or-tab-panel--view' : (tone !== undefined ? 'or-tab-panel--tone-' + tone : '')]" role="tabpanel">
      <HandCardsPanel v-if="handTabActive" :playerView="playerView"/>
      <!-- Die Frage gehört zur Eingabe und steht daher in ihrer Box, nicht über den Tabs -->
      <!-- Feldwahl u. Ä.: Plättchen, Frage und Hinweis (tabIntro.ts); sonst nur die Frage -->
      <TabIntroBlock v-if="intro !== undefined" v-show="!handTabActive" :intro="intro" :title="fullTabTitle(playerinput.title)" :playerView="playerView" :card="sourceCard"/>
      <!-- Löst eine Karte die Eingabe aus (Sabotage, Komet für Venus …): Karte, Name und Text statt "Wähle eine Option" -->
      <CardIntroBlock v-else-if="sourceCard !== undefined" v-show="!handTabActive" :card="sourceCard" :title="fullTabTitle(lead.title)"/>
      <label v-else v-show="!handTabActive" class="or-tab-panel-title"><div>{{ $t(fullTabTitle(lead.title)) }}</div></label>
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
import HandCardsPanel from '@/client/components/HandCardsPanel.vue';
import {OR_OPTIONS_AS_TABS} from '@/client/components/orOptionsLayout';
import {TAB_PANEL_FOOTER, newTabPanelFooterId} from '@/client/components/tabPanelFooter';
import {fullTabTitle, inputTabLabel} from '@/client/components/orOptionsShortLabels';
import {inputAvailableCount} from '@/client/components/inputAvailableCount';
import {inputTone} from '@/client/components/inputTone';
import {tabIntro} from '@/client/components/tabIntro';
import {choiceMenuLead} from '@/client/components/choiceMenu';
import {inputSourceCard} from '@/client/components/inputSourceCard';
import TabIntroBlock from '@/client/components/TabIntroBlock.vue';
import CardIntroBlock from '@/client/components/CardIntroBlock.vue';
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
// Bei einer Entscheidung mit Spielerwahl bestimmt diese Frage, Beschriftung und Farbe (choiceMenu.ts)
const lead = computed(() => choiceMenuLead(props.playerinput));
// Farbton des Eingabe-Tabs (Präludium rosa, Angriff rot, Karten orange …)
const tone = computed(() => inputTone(lead.value));
const intro = computed(() => tabIntro(props.playerinput));
const sourceCard = computed(() => inputSourceCard(props.playerinput));
</script>
