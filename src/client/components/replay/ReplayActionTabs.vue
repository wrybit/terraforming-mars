<template>
  <!-- The game's own action tabs, view only: the menu of the chosen player at this step (replayActionMenu.ts).
       On an own action its tab is open and the chosen card, milestone or award is marked. -->
  <div ref="root" class="replay-action-tabs">
    <PlayerInputFactory :key="stepKey" :players="playerView.players" :playerView="playerView" :playerinput="menu"
      :onsave="ignore" :showsave="true" :showtitle="true" />
  </div>
</template>

<script setup lang="ts">
import {nextTick, onMounted, provide, ref, watch} from 'vue';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import {OrOptionsModel} from '@/common/models/PlayerInputModel';
import {OR_OPTIONS_AS_TABS} from '@/client/components/orOptionsLayout';
import {CANCEL_ACTION} from '@/client/components/cancelAction';
import PlayerInputFactory from '@/client/components/PlayerInputFactory.vue';
import {ReplayActionFocus} from './replayActionMenu';

const props = defineProps<{
  playerView: PlayerViewModel,
  menu: OrOptionsModel,
  focus: ReplayActionFocus | undefined,
  // Remounts the menu for every step: the tabs read their preselection only when they are created
  stepKey: number,
}>();

// Tabs like in the game; there is nothing to send or to cancel in a replay
provide(OR_OPTIONS_AS_TABS, true);
provide(CANCEL_ACTION, {available: () => false, cancel: () => undefined});
const ignore = () => undefined;

const root = ref<HTMLElement>();
const FOCUS_CLASS = 'replay-action-tabs__focus';

// Marks the cards of the action (class card-<name> of Card.vue) and the open tab, and scrolls the card into view
async function markFocus(): Promise<void> {
  await nextTick();
  const element = root.value;
  if (element === undefined) {
    return;
  }
  element.querySelectorAll('.' + FOCUS_CLASS).forEach((marked) => marked.classList.remove(FOCUS_CLASS));
  if (props.focus === undefined) {
    // No own action in this step: the hand, like between one's turns in the game
    element.querySelector<HTMLElement>('.or-tab--hand')?.click();
    return;
  }
  element.querySelector('.or-tab--active')?.classList.add(FOCUS_CLASS);
  // Pass, end turn, conversions: the tab's own button is what the player pressed
  if (props.focus.cards.length === 0 && props.focus.item === undefined) {
    element.querySelector('.or-tab-save')?.classList.add(FOCUS_CLASS);
  }
  props.focus.cards.forEach((card, index) => {
    const slug = 'card-' + card.toLowerCase().replaceAll(' ', '-');
    const found = element.querySelector(`.or-tab-panel [class~="${slug}"]`);
    const box = found?.closest('label, .cardbox') ?? found;
    box?.classList.add(FOCUS_CLASS);
    // Chosen like a click in the game: the card is the selected one (radio) or among the selected ones (sold cards)
    const input = box?.closest('label')?.querySelector<HTMLInputElement>('input');
    if (input !== undefined && input !== null && !input.checked) {
      input.click();
    }
    if (index === 0) {
      box?.scrollIntoView({block: 'nearest', inline: 'nearest'});
    }
  });
}

onMounted(markFocus);
watch(() => props.stepKey, markFocus, {flush: 'post'});
</script>
