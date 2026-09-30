import {nextTick} from 'vue';
import {Message} from '@/common/logs/Message';
import {OrOptionsModel, PlayerInputModel} from '@/common/models/PlayerInputModel';
import {inputAvailableCount} from '@/client/components/inputAvailableCount';
import {displayedOptionIndices} from '@/client/components/orOptionsDisplayed';
import {GlyphName} from '@/client/components/mobile/mobileGlyphs';
import {endTabHint, fullTabTitle, isEndTab, shortTabLabel, tabButtonLabel, tabButtonTone, tabDisplayOrder, tabHighlighted, titleKey} from '@/client/components/orOptionsShortLabels';
import {warningDescription} from '@/client/components/warningDescriptions';
import {tabIntro, TabIntro} from '@/client/components/tabIntro';
import {placementLabel, previewTileForSpaceInput} from '@/client/components/spaceTilePreview';

/*
 * Zug-Menü der Mobil-Ansicht (Bottom-Sheet), gebaut aus demselben Aktionsmenü wie die Desktop-Tabs.
 *
 * Kurzlabel, Zähler, Reihenfolge und Farbton kommen aus denselben Helfern wie in OrOptions; neu ist nur das
 * Symbol je Aktion. Texte ausschließlich aus vorhandenen Übersetzungen (Server-Titel, Kurzlabels), keine eigenen.
 */

/* Farbton einer Kachel: Grünfläche grün, Temperatur orange, Meilenstein gold. */
export type TurnTileTone = 'success' | 'heat' | 'highlight' | 'danger';

/* Farbe der Symbol-Kachel nach Spielbereich (Klassen mb-tile-icon--… in mobile.less). */
export type TurnTileGlyphTone = 'cards' | 'megacredits' | 'plants' | 'heat' | 'honors' | 'colonies' | 'neutral';

/*
 * Aktionen ohne eigene Auswahl (Temperatur, Grünfläche, Weitergeben, Beenden) fragen direkt in der Schublade nach,
 * statt eine fast leere Vollbild-Aufgabe zu öffnen. Inhalt wie im Desktop-Tab: Erklärung (tabIntro.ts), Hinweis
 * bzw. Server-Warnung und der Button.
 */
export type TurnConfirmation = {
  // Bild, voller Titel und Spielstand-Zeilen; fehlt, dann nur Kurzlabel und Hinweis
  intro: TabIntro | undefined;
  title: string | Message;
  hint: string | undefined;
  button: string | Message;
  // submit: Button des Tabs sofort auslösen; place: Aufgabe öffnen, die gleich die Feldwahl auf dem Mars startet
  action: 'submit' | 'place';
};

/* Eintrag im Sheet bzw. Kopf der daraus geöffneten Aufgabe. */
export type TurnMenuTile = {
  // Index in den angezeigten Optionen von OrOptions (data-option-index des Tabs)
  index: number;
  // Englischer Titel-Schlüssel der Option (z. B. 'Play project card')
  key: string;
  label: string | Message;
  // Unterzeile: voller Titel der Option, wenn er mehr sagt als das Kurzlabel (Grünfläche, Temperatur)
  detail: string | Message | undefined;
  // Anzahl wählbarer Einträge wie am Desktop-Tab; undefined, wenn die Aktion keine Auswahl hat
  count: number | undefined;
  // Symbol in einer Farbkachel; die Farbe steht für den Spielbereich (Karten, M€, Pflanzen …)
  glyph: GlyphName;
  glyphTone: TurnTileGlyphTone;
  tone: TurnTileTone | undefined;
  // Nichts wählbar (Zähler 0): Kachel abgeschwächt
  empty: boolean;
  // Aktion ohne Auswahl: statt einer eigenen Aufgabe eine Rückfrage im Sheet
  confirmation: TurnConfirmation | undefined;
};

/* Sheet-Inhalt, gruppiert wie im Mockup. */
export type TurnMenu = {
  available: Array<TurnMenuTile>;
  actions: Array<TurnMenuTile>;
  // Zweite Aktion auslassen (nur nach der ersten Aktion möglich)
  skip: TurnMenuTile | undefined;
  pass: TurnMenuTile | undefined;
};

type TileLook = {glyph: GlyphName, glyphTone: TurnTileGlyphTone};

// Symbol und Farbe je Titel-Schlüssel
const TILE_LOOKS: Readonly<Record<string, TileLook>> = {
  'Claim a milestone': {glyph: 'milestone', glyphTone: 'honors'},
  'Convert ${0} plants into greenery': {glyph: 'greenery', glyphTone: 'plants'},
  'Convert 8 heat into temperature': {glyph: 'temperature', glyphTone: 'heat'},
  'Convert 6 heat into temperature': {glyph: 'temperature', glyphTone: 'heat'},
  'Perform an action from a played card': {glyph: 'cardActions', glyphTone: 'cards'},
  'Play project card': {glyph: 'playCard', glyphTone: 'cards'},
  'Fund an award (${0} M€)': {glyph: 'award', glyphTone: 'honors'},
  'Standard projects': {glyph: 'standardProjects', glyphTone: 'megacredits'},
  'Sell patents': {glyph: 'sellPatents', glyphTone: 'megacredits'},
  'Trade with a colony tile': {glyph: 'colonyTrade', glyphTone: 'colonies'},
};
// Unbekannte Aktionen (Erweiterungen) bekommen ein neutrales Symbol, damit das Raster einheitlich bleibt
const DEFAULT_LOOK: TileLook = {glyph: 'more', glyphTone: 'neutral'};
const END_TURN = 'End Turn';

function toTile(option: PlayerInputModel, index: number): TurnMenuTile {
  const key = titleKey(option.title);
  const look: TileLook = TILE_LOOKS[key] ?? DEFAULT_LOOK;
  const label = shortTabLabel(option.title);
  const count = inputAvailableCount(option);
  const buttonTone = tabButtonTone(option.title);
  return {
    index,
    key,
    label,
    // Aktionen ohne Auswahl (Grünfläche, Temperatur): der volle Titel sagt, was passiert
    detail: count === undefined && titleKey(label) !== key ? fullTabTitle(option.title) : undefined,
    count,
    glyph: look.glyph,
    glyphTone: look.glyphTone,
    tone: buttonTone ?? (tabHighlighted(option.title) ? 'highlight' : undefined),
    empty: count === 0,
    confirmation: quickConfirmation(option),
  };
}

function quickConfirmation(option: PlayerInputModel): TurnConfirmation | undefined {
  const intro = tabIntro(option);
  // "Feld auf dem Mars antippen" gilt erst nach dem Button, nicht schon in der Rückfrage
  const drawerIntro = intro === undefined ? undefined : {...intro, hint: undefined};
  const title = fullTabTitle(option.title);
  if (option.type === 'option') {
    const warnings = option.warnings ?? [];
    return {
      intro: drawerIntro,
      title,
      hint: endTabHint(option.title) ?? (warnings.length > 0 ? warningDescription(warnings[0]) : undefined),
      button: tabButtonLabel(option.title, option.buttonLabel),
      action: 'submit',
    };
  }
  if (option.type === 'space') {
    const tile = previewTileForSpaceInput(option.title);
    return {intro: drawerIntro, title, hint: undefined, button: tile === undefined ? title : placementLabel(tile), action: 'place'};
  }
  return undefined;
}

/* Baut das Sheet aus dem Aktionsmenü `input`. */
export function buildTurnMenu(input: OrOptionsModel): TurnMenu {
  const displayed = displayedOptionIndices(input).map((index) => input.options[index]);
  const order = tabDisplayOrder(displayed.map((option) => option.title));
  const tiles = order.map((index) => ({option: displayed[index], tile: toTile(displayed[index], index)}));
  const regular = tiles.filter(({option}) => !isEndTab(option.title));
  const end = tiles.filter(({option}) => isEndTab(option.title));
  return {
    available: regular.filter(({option}) => tabHighlighted(option.title)).map(({tile}) => tile),
    actions: regular.filter(({option}) => !tabHighlighted(option.title)).map(({tile}) => tile),
    skip: end.find(({option}) => titleKey(option.title) === END_TURN)?.tile,
    pass: end.find(({option}) => titleKey(option.title) !== END_TURN)?.tile,
  };
}

/* Kachel zur Option `index`, gleich in welchem Bereich des Sheets sie steht. */
export function findTurnMenuTile(menu: TurnMenu | undefined, index: number): TurnMenuTile | undefined {
  return menu === undefined ? undefined : [...menu.available, ...menu.actions, menu.skip, menu.pass].find((tile) => tile?.index === index);
}

const TAB_SELECTOR = '.wf-options--tabs > .or-tabs > .or-tab[data-option-index]';

/* Wählt im eingebundenen Aktionsmenü unter `root` die Aktion `index` (wie ein Klick auf ihren Tab). */
export function selectTurnMenuTile(root: HTMLElement, index: number): void {
  root.querySelector<HTMLElement>(`${TAB_SELECTOR}[data-option-index="${index}"]`)?.click();
}

/* Titel der gerade offenen Eingabe außerhalb des Aktionsmenüs (aktiver Eingabe-Tab von WaitingForTabs). */
export function readInputTitle(root: HTMLElement): string | undefined {
  return root.querySelector<HTMLElement>('.or-tabs > .or-tab--active:not(.or-tab--hand)')?.getAttribute('title') ?? undefined;
}

/* Löst im Aktionsmenü unter `root` die Aktion `index` direkt aus (Tab wählen, dann dessen Button), z. B. nach der Rückfrage im Sheet. */
export async function submitTurnMenuTile(root: HTMLElement, index: number): Promise<void> {
  selectTurnMenuTile(root, index);
  await nextTick();
  const menu = root.querySelector<HTMLElement>('.wf-options--tabs');
  // Nur der Fuß des Aktionsmenüs selbst, nicht der eines darin verschachtelten Menüs
  const footer = Array.from(root.querySelectorAll<HTMLElement>('.or-tab-footer')).find((element) => element.closest('.wf-options--tabs') === menu);
  footer?.querySelector<HTMLButtonElement>('.or-tab-save .btn')?.click();
}

export const PLAY_CARD_KEY = 'Play project card';

/* Kachel "Karte spielen", wenn `cardName` darin spielbar ist. */
export function playableCardTile(menu: TurnMenu | undefined, input: OrOptionsModel | undefined, cardName: string): TurnMenuTile | undefined {
  const tile = menu?.actions.find((entry) => entry.key === PLAY_CARD_KEY);
  if (tile === undefined || input === undefined) {
    return undefined;
  }
  const option = input.options.find((entry) => titleKey(entry.title) === PLAY_CARD_KEY);
  const playable = option?.type === 'projectCard' && option.cards.some((card) => card.name === cardName && card.isDisabled !== true);
  return playable ? tile : undefined;
}
