<template>
  <!-- Every input that is not an action menu (buy cards, draft, selection …), in the tab container:
       hand cards tab (gray, view only) and an active tab for the input; its question sits at the top of the box.
       The action menu (OrOptions) builds its own tabs, see orOptionsLayout.ts. -->
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
      <!-- The question belongs to the input and therefore sits in its box, not above the tabs -->
      <!-- Space selection etc.: tile, question and hint (tabIntro.ts); otherwise only the question -->
      <TabIntroBlock v-if="intro !== undefined" v-show="!handTabActive" :intro="intro" :title="fullTabTitle(playerinput.title)" :playerView="playerView" :card="sourceCard"/>
      <!-- If a card triggers the input (Sabotage, Comet for Venus …): card, name and text instead of "Select an option" -->
      <CardIntroBlock v-else-if="sourceCard !== undefined" v-show="!handTabActive" :card="sourceCard" :title="fullTabTitle(lead.title)"/>
      <label v-else v-show="!handTabActive" class="or-tab-panel-title"><div>{{ $t(fullTabTitle(lead.title)) }}</div></label>
      <!-- v-show instead of v-if: inputs are kept while looking at the hand -->
      <PlayerInputFactory v-show="!handTabActive"
        :players="playerView.players"
        :playerView="playerView"
        :playerinput="playerinput"
        :onsave="onsave"
        :showsave="true"
        :showtitle="false"/>
      <!-- Draft: cards already kept below the new ones, instead of a separate block under the box -->
      <DraftedCardsSection v-if="draftedCards.length > 0" v-show="!handTabActive" :cards="draftedCards"/>
      <!-- Sticky footer at the bottom of the box (tabPanelFooter.ts); payment areas attach via Teleport -->
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
import DraftedCardsSection from '@/client/components/DraftedCardsSection.vue';
import {draftedCardsInInput} from '@/client/utils/draftedCards';
import {allCardsInHand} from '@/client/utils/handCards';

const props = defineProps<{
  playerView: PlayerViewModel;
  playerinput: PlayerInputModel;
  onsave: (out: InputResponse) => void;
}>();

// Nested selections in the input stay radio lists, no second tab bar
provide(OR_OPTIONS_AS_TABS, false);
const footerId = newTabPanelFooterId();
provide(TAB_PANEL_FOOTER, '#' + footerId);

const handTabActive = ref(false);
const handCards = computed(() => allCardsInHand(props.playerView));
const count = computed(() => inputAvailableCount(props.playerinput));
// For a decision with player selection this determines question, label and color (choiceMenu.ts)
const lead = computed(() => choiceMenuLead(props.playerinput));
// Tone of the input tab (prelude pink, attack red, cards orange …)
const tone = computed(() => inputTone(lead.value));
const intro = computed(() => tabIntro(props.playerinput));
const sourceCard = computed(() => inputSourceCard(props.playerinput));
const draftedCards = computed(() => draftedCardsInInput(props.playerView));
</script>
