import {InjectionKey} from 'vue';

// Vertrag zwischen Tab-Boxen (OrOptions, WaitingForTabs: Anbieter) und Eingaben mit Bezahl- und
// Bestätigungsbereich (PaymentForm: Nutzer). Die Box hat unten einen klebenden Fußbereich (Stil in
// tab_panel_footer.less); der Nutzer hängt sich per Teleport dort ein. Wert = CSS-Selektor des Fußbereichs.
export const TAB_PANEL_FOOTER: InjectionKey<string> = Symbol('tabPanelFooter');

let footerCount = 0;

// Eindeutige id je Tab-Box, damit der Teleport genau in den eigenen Fußbereich zielt
export function newTabPanelFooterId(): string {
  footerCount++;
  return 'tab-panel-footer-' + footerCount;
}
