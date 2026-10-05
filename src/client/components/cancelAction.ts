import {InjectionKey} from 'vue';

// "Cancel" for an action that is still only a plan (server actionStart.ts): WaitingFor provides availability
// and the request, the footers of the input boxes show the button (CancelActionButton.vue)
export type CancelAction = {
  available: () => boolean,
  cancel: () => void,
};

export const CANCEL_ACTION: InjectionKey<CancelAction> = Symbol('cancelAction');
