import {CardName} from '@/common/cards/CardName';
import {optionSourceCard} from '@/client/components/inputSourceCard';
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
import {PLAY_CARD_KEY} from '@/client/utils/playableCards';

/*
 * Turn menu of the mobile view (bottom sheet), built from the same action menu as the desktop tabs.
 *
 * Short label, counter, order and tone come from the same helpers as in OrOptions; the only new thing is the
 * icon per action. Texts come only from existing translations (server titles, short labels), none of its own.
 */

/* Tone of a tile: greenery green, temperature orange, milestone gold. */
export type TurnTileTone = 'success' | 'heat' | 'highlight' | 'danger';

/* Color of the icon tile by game area (classes mb-tile-icon--… in mobile.less). */
export type TurnTileGlyphTone = 'cards' | 'megacredits' | 'plants' | 'heat' | 'honors' | 'colonies' | 'neutral';

/*
 * Actions without their own selection (temperature, greenery, pass, end) ask for confirmation right in the drawer
 * instead of opening an almost empty full-screen task. Content as in the desktop tab: explanation (tabIntro.ts), hint
 * or server warning, and the button.
 */
export type TurnConfirmation = {
  // Image, full title and game state lines; if missing, only short label and hint
  intro: TabIntro | undefined;
  // Card the action triggers (e.g. corporation first action), shown instead of a bare label (inputSourceCard.ts)
  card?: CardName;
  title: string | Message;
  hint: string | undefined;
  button: string | Message;
  // submit: trigger the tab's button immediately; place: open a task that starts space selection on Mars right away
  action: 'submit' | 'place';
};

/* Entry in the sheet, or header of the task opened from it. */
export type TurnMenuTile = {
  // Index in the displayed options of OrOptions (data-option-index of the tab)
  index: number;
  // English title key of the option (e.g. 'Play project card')
  key: string;
  label: string | Message;
  // Subline: full title of the option when it says more than the short label (greenery, temperature)
  detail: string | Message | undefined;
  // Number of selectable entries as on the desktop tab; undefined if the action has no selection
  count: number | undefined;
  // Icon in a colored tile; the color stands for the game area (cards, M€, plants …)
  glyph: GlyphName;
  glyphTone: TurnTileGlyphTone;
  tone: TurnTileTone | undefined;
  // Nothing selectable (counter 0): tile dimmed
  empty: boolean;
  // Action without selection: a confirmation in the sheet instead of its own task
  confirmation: TurnConfirmation | undefined;
};

/* Sheet content, grouped as in the mockup. */
export type TurnMenu = {
  available: Array<TurnMenuTile>;
  actions: Array<TurnMenuTile>;
  // Skip the second action (only possible after the first action)
  skip: TurnMenuTile | undefined;
  pass: TurnMenuTile | undefined;
};

type TileLook = {glyph: GlyphName, glyphTone: TurnTileGlyphTone};

// Icon and color per title key
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
// Unknown actions (expansions) get a neutral icon so the grid stays uniform
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
    // Actions without selection (greenery, temperature): the full title says what happens
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
  // "Tap a space on Mars" only applies after the button, not yet in the confirmation
  const drawerIntro = intro === undefined ? undefined : {...intro, hint: undefined};
  const title = fullTabTitle(option.title);
  if (option.type === 'option') {
    const warnings = option.warnings ?? [];
    return {
      intro: drawerIntro,
      card: optionSourceCard(option),
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

/* Builds the sheet from the action menu `input`. */
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

/* Tile for option `index`, regardless of which sheet section it is in. */
export function findTurnMenuTile(menu: TurnMenu | undefined, index: number): TurnMenuTile | undefined {
  return menu === undefined ? undefined : [...menu.available, ...menu.actions, menu.skip, menu.pass].find((tile) => tile?.index === index);
}

const TAB_SELECTOR = '.wf-options--tabs > .or-tabs > .or-tab[data-option-index]';

/* Selects action `index` in the embedded action menu under `root` (like a click on its tab). */
export function selectTurnMenuTile(root: HTMLElement, index: number): void {
  root.querySelector<HTMLElement>(`${TAB_SELECTOR}[data-option-index="${index}"]`)?.click();
}

/* Title of the currently open input outside the action menu (active input tab of WaitingForTabs). */
export function readInputTitle(root: HTMLElement): string | undefined {
  return root.querySelector<HTMLElement>('.or-tabs > .or-tab--active:not(.or-tab--hand)')?.getAttribute('title') ?? undefined;
}

/* Triggers action `index` in the action menu under `root` directly (select tab, then its button), e.g. after the confirmation in the sheet. */
export async function submitTurnMenuTile(root: HTMLElement, index: number): Promise<void> {
  selectTurnMenuTile(root, index);
  await nextTick();
  const menu = root.querySelector<HTMLElement>('.wf-options--tabs');
  // Only the footer of the action menu itself, not that of a menu nested inside it
  const footer = Array.from(root.querySelectorAll<HTMLElement>('.or-tab-footer')).find((element) => element.closest('.wf-options--tabs') === menu);
  footer?.querySelector<HTMLButtonElement>('.or-tab-save .btn')?.click();
}

// Defined in playableCards.ts, shared with the build tab's "Not playable" section
export {PLAY_CARD_KEY};

/* "Play card" tile, if `cardName` is playable in it. */
export function playableCardTile(menu: TurnMenu | undefined, input: OrOptionsModel | undefined, cardName: string): TurnMenuTile | undefined {
  const tile = menu?.actions.find((entry) => entry.key === PLAY_CARD_KEY);
  if (tile === undefined || input === undefined) {
    return undefined;
  }
  const option = input.options.find((entry) => titleKey(entry.title) === PLAY_CARD_KEY);
  const playable = option?.type === 'projectCard' && option.cards.some((card) => card.name === cardName && card.isDisabled !== true);
  return playable ? tile : undefined;
}
