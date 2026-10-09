<template>
  <!-- Every input that is not an action menu (buy cards, draft, selection …), in the tab container:
       hand cards tab (gray, view only) and an active tab for the input; its question sits at the top of the box.
       The action menu (OrOptions) builds its own tabs, see orOptionsLayout.ts. -->
  <div class="wf-options wf-options--tabs">
    <div class="or-tabs" role="tablist">
      <HandCardsTab :count="handCards.length" :active="handTabActive" @select="handTabActive = true"/>
      <button type="button" role="tab"
        :title="$t(fullTabTitle(tabSource.title))"
        :aria-selected="!handTabActive"
        :class="['or-tab', {'or-tab--active': !handTabActive}, tone !== undefined ? 'or-tab--tone-' + tone : '']"
        @click="handTabActive = false">
        <span class="or-tab-title">{{ $t(inputTabLabel(tabSource)) }}</span>
        <span v-if="count !== undefined" class="or-tab-count">{{ count }}</span>
      </button>
      <!-- Choice can still be changed (e.g. draft) while others are choosing: same red status tab as without an input -->
      <WaitingForPlayersTab v-if="playerinput.optional === true" :playerView="playerView"/>
    </div>

    <div v-docked-tab :class="['or-tab-panel', handTabActive ? 'or-tab-panel--view' : (tone !== undefined ? 'or-tab-panel--tone-' + tone : '')]" role="tabpanel">
      <HandCardsPanel v-if="handTabActive" :playerView="playerView"/>
      <!-- The question belongs to the input and therefore sits in its box, not above the tabs.
           Card lists with a header row: the header row stays at the very top, the intro moves below it (tabPanelIntro.ts) -->
      <Teleport :to="'#' + introId" :disabled="introConsumers === 0" defer>
      <!-- Space selection etc.: tile, question and hint (tabIntro.ts); otherwise only the question -->
      <TabIntroBlock v-if="intro !== undefined" v-show="!handTabActive" :intro="intro" :title="fullTabTitle(intro.finale === true ? playerinput.title : shown.title)" :playerView="playerView" :card="sourceCard"/>
      <!-- If a card triggers the input (Sabotage, Comet for Venus …): card, name and text instead of "Select an option" -->
      <CardIntroBlock v-else-if="sourceCard !== undefined" v-show="!handTabActive" :card="sourceCard" :title="fullTabTitle(lead.title)"/>
      <!-- Draft repick: the explanation is no question, it moves small into the footer next to the button -->
      <!-- Below a header row: the plain question as a small caption -->
      <label v-else-if="!draftRepick" v-show="!handTabActive" :class="introConsumers === 0 ? 'or-tab-panel-title' : 'or-tab-panel-caption'"><div>{{ $t(fullTabTitle(lead.title)) }}</div></label>
      </Teleport>
      <!-- v-show instead of v-if: inputs are kept while looking at the hand -->
      <PlayerInputFactory v-show="!handTabActive"
        :players="playerView.players"
        :playerView="playerView"
        :playerinput="shown"
        :onsave="saveShown"
        :showsave="true"
        :showtitle="false"/>
      <!-- Draft: cards already kept below the new ones, instead of a separate block under the box -->
      <DraftedCardsSection v-if="draftedCards.length > 0" v-show="!handTabActive" :cards="draftedCards"/>
      <!-- Sticky footer at the bottom of the box (tabPanelFooter.ts); payment areas attach via Teleport -->
      <div v-show="!handTabActive" :id="footerId" class="or-tab-footer">
        <!-- Cancel an action that is still only a plan: left in the footer (cancelAction.ts) -->
        <CancelActionButton/>
        <!-- Declining a space selection (spaceWithSkip.ts): red like Skip next to a card selection (SelectCard.vue) -->
        <AppButton v-for="index in spaceChoice?.skipIndices ?? []" :key="index" type="submit" class="btn-tone-danger"
          :title="$t(skipTitle(index))" @click="skip(index)"/>
        <p v-if="draftRepick" class="or-tab-footer-hint">{{ $t(fullTabTitle(lead.title)) }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed, provide, ref} from 'vue';
import {vDockedTab} from '@/client/directives/DockedTab';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import {OrOptionsModel, PlayerInputModel} from '@/common/models/PlayerInputModel';
import {InputResponse} from '@/common/inputs/InputResponse';
import HandCardsTab from '@/client/components/HandCardsTab.vue';
import CancelActionButton from '@/client/components/CancelActionButton.vue';
import HandCardsPanel from '@/client/components/HandCardsPanel.vue';
import WaitingForPlayersTab from '@/client/components/WaitingForPlayersTab.vue';
import {OR_OPTIONS_AS_TABS} from '@/client/components/orOptionsLayout';
import {TAB_PANEL_FOOTER, newTabPanelFooterId} from '@/client/components/tabPanelFooter';
import {TAB_PANEL_INTRO, newTabPanelIntroId} from '@/client/components/tabPanelIntro';
import {fullTabTitle, inputTabLabel} from '@/client/components/orOptionsShortLabels';
import {inputAvailableCount} from '@/client/components/inputAvailableCount';
import {inputTone} from '@/client/components/inputTone';
import {tabIntro} from '@/client/components/tabIntro';
import {choiceMenuLead} from '@/client/components/choiceMenu';
import {inputSourceCard} from '@/client/components/inputSourceCard';
import TabIntroBlock from '@/client/components/TabIntroBlock.vue';
import CardIntroBlock from '@/client/components/CardIntroBlock.vue';
import DraftedCardsSection from '@/client/components/DraftedCardsSection.vue';
import {draftedCardsInInput, isDraftRepick} from '@/client/utils/draftedCards';
import {allCardsInHand} from '@/client/utils/handCards';
import {shownInput, spaceWithSkip} from '@/client/components/spaceWithSkip';
import AppButton from '@/client/components/common/AppButton.vue';
import {Message} from '@/common/logs/Message';

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
const count = computed(() => inputAvailableCount(shown.value));
// For a decision with player selection this determines question, label and color (choiceMenu.ts)
// Space selection with skip: the box shows only the space selection, the skip sits in the footer (spaceWithSkip.ts)
const spaceChoice = computed(() => spaceWithSkip(props.playerinput));
const shown = computed(() => shownInput(props.playerinput));
const lead = computed(() => choiceMenuLead(shown.value));
// Tab label and tooltip: the input's own title (e.g. "final greenery" instead of the space selection inside it)
const tabSource = computed(() => spaceChoice.value === undefined ? lead.value : props.playerinput);
// Tone of the input tab (prelude pink, attack red, cards orange …)
const tone = computed(() => inputTone(lead.value));
const intro = computed(() => tabIntro(shown.value, props.playerinput));
const sourceCard = computed(() => inputSourceCard(props.playerinput));
const draftedCards = computed(() => draftedCardsInInput(props.playerView));
const draftRepick = computed(() => isDraftRepick(props.playerView, props.playerinput));

// Card lists with a header row take the intro below that row (tabPanelIntro.ts)
const introId = newTabPanelIntroId();
const introConsumers = ref(0);
provide(TAB_PANEL_INTRO, {targetId: introId, consumers: introConsumers});

// Answers of the shown space selection go back wrapped as the choice of its option
function saveShown(response: InputResponse): void {
  const choice = spaceChoice.value;
  props.onsave(choice === undefined ? response : {type: 'or', index: choice.spaceIndex, response});
}

function skipTitle(index: number): string | Message {
  return (props.playerinput as OrOptionsModel).options[index].title;
}

function skip(index: number): void {
  props.onsave({type: 'or', index, response: {type: 'option'}});
}
</script>
