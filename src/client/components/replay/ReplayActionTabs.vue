<template>
  <!-- The game's own action tabs, view only: the menu of the step's actor (replayActionMenu.ts).
       On an own action its tab is open and the chosen card, milestone or award is marked. -->
  <div ref="root" class="replay-action-tabs"
    @click.capture="readOnly" @pointerdown.capture="readOnly" @mousedown.capture="readOnly" @keydown.capture="readOnly">
    <PlayerInputFactory :players="playerView.players" :playerView="playerView" :playerinput="model"
      :onsave="ignore" :showsave="true" :showtitle="true" />
  </div>
</template>

<script setup lang="ts">
import {nextTick, onMounted, provide, reactive, ref, watch} from 'vue';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import {OrOptionsModel, PlayerInputModel} from '@/common/models/PlayerInputModel';
import {OR_OPTIONS_AS_TABS} from '@/client/components/orOptionsLayout';
import {CANCEL_ACTION} from '@/client/components/cancelAction';
import {displayedOptionIndices} from '@/client/components/orOptionsDisplayed';
import {milestoneAwardImageClass} from '@/client/components/milestoneAwardChoice';
import PlayerInputFactory from '@/client/components/PlayerInputFactory.vue';
import {ReplayActionFocus} from './replayActionMenu';
import {reuseUnchanged} from './replayReuse';

const props = defineProps<{
  playerView: PlayerViewModel,
  menu: OrOptionsModel,
  focus: ReplayActionFocus | undefined,
}>();

// Tabs like in the game; there is nothing to send or to cancel in a replay
provide(OR_OPTIONS_AS_TABS, true);
provide(CANCEL_ACTION, {available: () => false, cancel: () => undefined});
const ignore = () => undefined;

// One menu for the whole replay, updated in place: the tabs keep their options (same objects) and only the cards that
// change are created – rebuilding the box every step made the card icons flicker and every step slow.
const titleOf = (input: PlayerInputModel): string => typeof input.title === 'string' ? input.title : input.title.message;
const model = reactive<OrOptionsModel>({...props.menu, options: [...props.menu.options]});
function update(menu: OrOptionsModel): void {
  const previous = new Map(model.options.map((option) => [titleOf(option), option]));
  model.options = menu.options.map((option) => {
    const kept = previous.get(titleOf(option));
    if (kept === undefined || kept.type !== option.type) {
      return option;
    }
    // Only changed fields: an unchanged card list keeps its array, so the cards in it don't render anew
    const target = kept as Record<string, unknown>;
    Object.entries(option).forEach(([key, value]) => {
      const reused = reuseUnchanged(target[key], value);
      if (reused !== target[key]) {
        target[key] = reused;
      }
    });
    return kept;
  });
  model.title = menu.title;
  model.initialIdx = menu.initialIdx;
}

const root = ref<HTMLElement>();
// Read only: the player only switches tabs; cards, buttons, filters and payments react to the replay alone. The
// replay marks the chosen card with a click of its own (not trusted), so only the user's own input is stopped; the
// change events that follow a click come from the browser (trusted), so they are not stopped here.
function readOnly(event: Event): void {
  const target = event.target as Element | null;
  if (!event.isTrusted || target?.closest('.or-tabs') !== null) {
    return;
  }
  // Keyboard: only Enter and Space would trigger something
  if (event instanceof KeyboardEvent && event.key !== 'Enter' && event.key !== ' ') {
    return;
  }
  event.preventDefault();
  event.stopPropagation();
}
const FOCUS_CLASS = 'replay-action-tabs__focus';
// Cards that came into the hand: not selected, so they are highlighted themselves
const ADDED_CLASS = 'replay-action-tabs__focus--added';
const click = (element: Element | null | undefined) => (element as HTMLElement | null | undefined)?.click();

// Opens the tab of the step's action like a click and marks what was chosen
async function showFocus(): Promise<void> {
  await nextTick();
  const element = root.value;
  if (element === undefined) {
    return;
  }
  element.querySelectorAll('.' + FOCUS_CLASS).forEach((marked) => marked.classList.remove(FOCUS_CLASS, ADDED_CLASS));
  const focus = props.focus;
  // No own action in this step: the open tab stays (switching would build its card list anew every step)
  if (focus === undefined) {
    return;
  }
  // Tabs are numbered in display order (orOptionsDisplayed.ts); the focused option is the menu's initialIdx
  const displayed = displayedOptionIndices(model).indexOf(model.initialIdx ?? -1);
  const tab = element.querySelector(`.or-tab[data-option-index="${displayed}"]`);
  click(tab);
  await nextTick();
  tab?.classList.add(FOCUS_CLASS);
  if (focus.item !== undefined) {
    const tile = element.querySelector(`.or-tab-panel .${milestoneAwardImageClass(focus.item)}`)?.closest('label');
    tile?.classList.add(FOCUS_CLASS);
    click(tile?.querySelector('input'));
  }
  // Pass, end turn, conversions: the tab's own button is what the player pressed
  if (focus.cards.length === 0 && focus.item === undefined && focus.added !== true) {
    element.querySelector('.or-tab-save')?.classList.add(FOCUS_CLASS);
  }
  focus.cards.forEach((card, index) => {
    const slug = 'card-' + card.toLowerCase().replaceAll(' ', '-');
    const found = element.querySelector(`.or-tab-panel [class~="${slug}"]`);
    const box = found?.closest('label, .cardbox') ?? found;
    box?.classList.add(FOCUS_CLASS);
    if (focus.added === true) {
      box?.classList.add(ADDED_CLASS);
    }
    // Chosen like a click in the game: the card is the selected one (radio) or among the selected ones (sold cards)
    const input = box?.closest('label')?.querySelector<HTMLInputElement>('input');
    if (focus.added !== true && input !== undefined && input !== null && !input.checked) {
      input.click();
    }
    if (index === 0) {
      box?.scrollIntoView({block: 'nearest', inline: 'nearest'});
    }
  });
}

watch(() => props.menu, (menu) => {
  update(menu);
  showFocus();
}, {flush: 'post'});
// At the start the hand, like between one's turns in the game
onMounted(async () => {
  await nextTick();
  click(root.value?.querySelector('.or-tab--hand'));
  showFocus();
});
</script>
