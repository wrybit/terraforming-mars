import {InjectionKey} from 'vue';

// Contract between tab boxes (OrOptions, WaitingForTabs: provider) and inputs with a payment and
// confirmation area (PaymentForm: consumer). The box has a sticky footer at the bottom (style in
// tab_panel_footer.less); the consumer hooks into it via Teleport. Value = CSS selector of the footer.
export const TAB_PANEL_FOOTER: InjectionKey<string> = Symbol('tabPanelFooter');

let footerCount = 0;

// Unique id per tab box so the Teleport targets exactly its own footer
export function newTabPanelFooterId(): string {
  footerCount++;
  return 'tab-panel-footer-' + footerCount;
}
