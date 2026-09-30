import {Message} from '@/common/logs/Message';
import {OrOptionsModel, PlayerInputModel} from '@/common/models/PlayerInputModel';
import {inputAvailableCount} from '@/client/components/inputAvailableCount';
import {displayedOptionIndices} from '@/client/components/orOptionsDisplayed';
import {GlyphName} from '@/client/components/mobile/mobileGlyphs';
import {isEndTab, shortTabLabel, tabButtonTone, tabDisplayOrder, tabHighlighted, titleKey} from '@/client/components/orOptionsShortLabels';

/*
 * Zug-Menü der Mobil-Ansicht (Bottom-Sheet), gebaut aus demselben Aktionsmenü wie die Desktop-Tabs.
 *
 * Kurzlabel, Zähler, Reihenfolge und Farbton kommen aus denselben Helfern wie in OrOptions; neu sind nur
 * Symbol und Unterzeile je Aktion (wie im Mockup).
 */

/* Farbton einer Kachel: Grünfläche grün, Temperatur orange, Meilenstein gold. */
export type TurnTileTone = 'success' | 'heat' | 'highlight' | 'danger';

/* Farbe der Symbol-Kachel nach Spielbereich (Klassen mb-tile-icon--… in mobile.less). */
export type TurnTileGlyphTone = 'cards' | 'megacredits' | 'plants' | 'heat' | 'honors' | 'colonies' | 'neutral';

/* Eintrag im Sheet bzw. Kopf der daraus geöffneten Aufgabe. */
export type TurnMenuTile = {
  // Index in den angezeigten Optionen von OrOptions (data-option-index des Tabs)
  index: number;
  // Englischer Titel-Schlüssel der Option (z. B. 'Play project card')
  key: string;
  label: string | Message;
  // Unterzeile, bereits mit Werten gefüllt; undefined, wenn es nichts zu sagen gibt
  sub: TurnTileSub | undefined;
  // Symbol in einer Farbkachel; die Farbe steht für den Spielbereich (Karten, M€, Pflanzen …)
  glyph: GlyphName;
  glyphTone: TurnTileGlyphTone;
  tone: TurnTileTone | undefined;
  // Nichts wählbar (Zähler 0): Kachel abgeschwächt
  empty: boolean;
};

/* Unterzeile als i18n-Schlüssel mit Parametern. */
export type TurnTileSub = {text: string, params: Array<string>};

/* Sheet-Inhalt, gruppiert wie im Mockup. */
export type TurnMenu = {
  available: Array<TurnMenuTile>;
  actions: Array<TurnMenuTile>;
  // Zweite Aktion auslassen (nur nach der ersten Aktion möglich)
  skip: TurnMenuTile | undefined;
  pass: TurnMenuTile | undefined;
};

type TileLook = {glyph: GlyphName, glyphTone: TurnTileGlyphTone, sub?: string};

// Symbol, Farbe und Unterzeile je Titel-Schlüssel ({count} = Zähler der Aktion)
const TILE_LOOKS: Readonly<Record<string, TileLook>> = {
  'Claim a milestone': {glyph: 'milestone', glyphTone: 'honors', sub: '${0} reachable'},
  'Convert ${0} plants into greenery': {glyph: 'greenery', glyphTone: 'plants'},
  'Convert 8 heat into temperature': {glyph: 'temperature', glyphTone: 'heat'},
  'Convert 6 heat into temperature': {glyph: 'temperature', glyphTone: 'heat'},
  'Perform an action from a played card': {glyph: 'cardActions', glyphTone: 'cards', sub: '${0} available'},
  'Play project card': {glyph: 'playCard', glyphTone: 'cards', sub: '${0} playable'},
  'Fund an award (${0} M€)': {glyph: 'award', glyphTone: 'honors', sub: '${0} to choose from'},
  'Standard projects': {glyph: 'standardProjects', glyphTone: 'megacredits', sub: '${0} affordable'},
  'Sell patents': {glyph: 'sellPatents', glyphTone: 'megacredits', sub: '${0} cards in hand'},
  'Trade with a colony tile': {glyph: 'colonyTrade', glyphTone: 'colonies', sub: '${0} available'},
};
// Unbekannte Aktionen (Erweiterungen) bekommen ein neutrales Symbol, damit das Raster einheitlich bleibt
const DEFAULT_LOOK: TileLook = {glyph: 'more', glyphTone: 'neutral'};
const DEFAULT_SUB = '${0} available';
const END_TURN = 'End Turn';

// Unterzeile für Aktionen ohne Auswahl: was genau passiert (z. B. Temperatur von … auf …)
function describe(option: PlayerInputModel, temperature: number): TurnTileSub | undefined {
  const key = titleKey(option.title);
  if (key === 'Convert ${0} plants into greenery') {
    return {text: key, params: typeof option.title === 'string' ? [] : option.title.data.map((entry) => String(entry.value))};
  }
  if (key.endsWith('heat into temperature')) {
    return {text: 'Temperature rises from ${0} to ${1} °C', params: [String(temperature), String(temperature + 2)]};
  }
  return undefined;
}

function toTile(option: PlayerInputModel, index: number, temperature: number): TurnMenuTile {
  const key = titleKey(option.title);
  const look: TileLook = TILE_LOOKS[key] ?? DEFAULT_LOOK;
  const count = inputAvailableCount(option);
  const buttonTone = tabButtonTone(option.title);
  const sub = describe(option, temperature) ??
    (count === undefined ? undefined : {text: look.sub ?? DEFAULT_SUB, params: [String(count)]});
  return {
    index,
    key,
    label: shortTabLabel(option.title),
    sub,
    glyph: look.glyph,
    glyphTone: look.glyphTone,
    tone: buttonTone ?? (tabHighlighted(option.title) ? 'highlight' : undefined),
    empty: count === 0,
  };
}

/* Baut das Sheet aus dem Aktionsmenü `input`; `temperature` für die Unterzeile "Temperatur erhöhen". */
export function buildTurnMenu(input: OrOptionsModel, temperature: number): TurnMenu {
  const displayed = displayedOptionIndices(input).map((index) => input.options[index]);
  const order = tabDisplayOrder(displayed.map((option) => option.title));
  const tiles = order.map((index) => ({option: displayed[index], tile: toTile(displayed[index], index, temperature)}));
  const regular = tiles.filter(({option}) => !isEndTab(option.title));
  const end = tiles.filter(({option}) => isEndTab(option.title));
  return {
    available: regular.filter(({option}) => tabHighlighted(option.title)).map(({tile}) => tile),
    actions: regular.filter(({option}) => !tabHighlighted(option.title)).map(({tile}) => tile),
    skip: end.find(({option}) => titleKey(option.title) === END_TURN)?.tile,
    pass: end.find(({option}) => titleKey(option.title) !== END_TURN)?.tile,
  };
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
