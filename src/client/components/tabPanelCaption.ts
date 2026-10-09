import {ComputedRef, InjectionKey, Ref} from 'vue';
import {Message} from '@/common/logs/Message';

// Contract between the tab box (WaitingForTabs: provider) and card lists with a header row (SelectCard,
// SelectProjectCardToPlay: consumers via TabPanelCaption.vue). The box's question normally sits at its top;
// a card list with a header row (zoom, filter, sorting) shows it as a small caption below that row instead,
// so the row stays at the box edge like in every other tab. `consumers` counts mounted captions: while one
// shows the question, the box leaves out its own.
export type TabPanelCaption = {
  title: ComputedRef<string | Message | undefined>;
  consumers: Ref<number>;
};

export const TAB_PANEL_CAPTION: InjectionKey<TabPanelCaption> = Symbol('tabPanelCaption');
