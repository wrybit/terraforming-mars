import {InjectionKey, Ref} from 'vue';

// Contract between the tab box (WaitingForTabs: provider) and card lists with a header row (SelectCard,
// SelectProjectCardToPlay: consumers via TabPanelIntroSlot.vue). The header row (zoom, filter, sorting) always
// stays at the very top of the box; the box's intro (question, tile or card intro) moves below it via Teleport
// into the slot the card list renders right after its header row. `consumers` counts mounted slots: while one
// is there, the box teleports its intro into it (target: `#targetId`).
export type TabPanelIntro = {
  targetId: string;
  consumers: Ref<number>;
};

export const TAB_PANEL_INTRO: InjectionKey<TabPanelIntro> = Symbol('tabPanelIntro');

let introCount = 0;

// Unique id per tab box so the Teleport targets exactly its own slot
export function newTabPanelIntroId(): string {
  introCount++;
  return 'tab-panel-intro-' + introCount;
}
