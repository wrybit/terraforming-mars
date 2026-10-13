import {Color} from '@/common/Color';
import {CardType} from '@/common/cards/CardType';
import {getCard} from '@/client/cards/ClientCardManifest';
import {LogAction, LogEffect, LogRow} from '@/client/components/logpanel/logActions';

// Filter of the log (LogFilterBar.vue): options as chips in the search field plus free text.
// Within a group the options are alternatives ("or"), the groups narrow each other down ("and").

export type LogFilterGroup = 'player' | 'me' | 'sign' | 'kind' | 'type' | 'icon';

export type LogFilterOption = {group: LogFilterGroup, value: string};

export type LogFilter = {
  options: ReadonlyArray<LogFilterOption>,
  // Free text, already lower case
  text: string,
};

// Order of the options in the bar: names (with "me"), +/−, kinds of moves, card colours, icons
export const LOG_FILTER_KINDS = ['action', 'ma', 'project'] as const;
export const LOG_FILTER_TYPES = ['active', 'event', 'automated'] as const;
export const LOG_FILTER_ICONS = [
  'megacredit', 'plant', 'steel', 'titanium', 'power', 'heat', 'animal', 'microbe', 'card', 'tr',
  'city', 'greenery', 'ocean', 'special',
] as const;

const CARD_TYPES: Record<string, CardType> = {active: CardType.ACTIVE, event: CardType.EVENT, automated: CardType.AUTOMATED};

export function isFilterActive(filter: LogFilter): boolean {
  return filter.options.length > 0 || filter.text !== '';
}

function values(filter: LogFilter, group: LogFilterGroup): Array<string> {
  return filter.options.filter((option) => option.group === group).map((option) => option.value);
}

// Icon an effect counts as: its resource, or the kind of tile (moon and other special tiles count as special)
function iconOf(effect: LogEffect): string | undefined {
  if (effect.tile !== undefined) {
    return ['city', 'greenery', 'ocean'].includes(effect.tile) ? effect.tile : 'special';
  }
  return effect.resource;
}

// Kind of move as a filter value
function kindOf(action: LogAction): string | undefined {
  switch (action.kind) {
  case 'action':
  case 'partyAction':
    return 'action';
  case 'milestone':
  case 'award':
    return 'ma';
  case 'standardProject':
    return 'project';
  default:
    return undefined;
  }
}

function cardTypeOf(action: LogAction): CardType | undefined {
  return action.kind === 'card' && action.card !== undefined ? getCard(action.card)?.type : undefined;
}

// Which effects of the row count for +/− and the icons: those of the selected players (or the acting one),
// with "me" in someone else's move only your own
function effectsInScope(action: LogAction, players: ReadonlyArray<string>, me: Color | undefined, meSelected: boolean): Array<LogEffect> | undefined {
  const othersOf = (colors: ReadonlyArray<string>) => action.others.filter((other) => colors.includes(other.player)).flatMap((other) => other.effects);
  if (players.length === 0 && !meSelected) {
    return [...action.effects, ...action.others.flatMap((other) => other.effects), ...(action.everyone ?? [])];
  }
  const actingSelected = action.player !== undefined && (players.includes(action.player) || (meSelected && action.player === me));
  if (actingSelected) {
    return action.effects;
  }
  // Someone else's move (or a turmoil row without player): effects on the selected players and on you
  const targets = [...players, ...(meSelected && me !== undefined ? [me] : [])];
  const touched = othersOf(targets);
  const everyone = action.everyone ?? [];
  if (touched.length === 0 && everyone.length === 0) {
    return undefined;
  }
  // A player filter alone shows the player's own moves only; "me" also shows moves that affect you
  return meSelected || action.player === undefined ? [...touched, ...everyone] : undefined;
}

// Does an action row pass the option groups? (Free text is checked separately, see rowMatches)
export function actionMatches(action: LogAction, filter: LogFilter, me: Color | undefined): boolean {
  const players = values(filter, 'player');
  const meSelected = values(filter, 'me').length > 0 && me !== undefined;
  const effects = effectsInScope(action, players, me, meSelected);
  if (effects === undefined) {
    return false;
  }
  const signs = values(filter, 'sign').map(Number);
  const icons = values(filter, 'icon');
  const counted = effects.filter((effect) => effect.tile !== undefined || effect.token === undefined);
  if (signs.length > 0 && !counted.some((effect) => effect.tile === undefined && signs.includes(Math.sign(effect.amount)) &&
    (icons.length === 0 || icons.includes(iconOf(effect) ?? '')))) {
    return false;
  }
  if (icons.length > 0 && !counted.some((effect) => icons.includes(iconOf(effect) ?? ''))) {
    return false;
  }
  const kinds = values(filter, 'kind');
  const types = values(filter, 'type');
  if (kinds.length + types.length > 0) {
    const kind = kindOf(action);
    const type = cardTypeOf(action);
    const typeMatches = type !== undefined && types.some((value) => CARD_TYPES[value] === type);
    if (!typeMatches && (kind === undefined || !kinds.includes(kind))) {
      return false;
    }
  }
  return true;
}

// One row: action rows by options and text, text lines only by text; card purchase and phase lines only without filter
export function rowMatches(row: LogRow, filter: LogFilter, me: Color | undefined, searchText: (row: LogRow) => string): boolean {
  if (!isFilterActive(filter)) {
    return true;
  }
  if (row.type === 'phase' || row.type === 'research') {
    return false;
  }
  if (row.type === 'message' && filter.options.length > 0) {
    return false;
  }
  if (row.type === 'action' && !actionMatches(row.action, filter, me)) {
    return false;
  }
  return filter.text === '' || searchText(row).toLowerCase().includes(filter.text);
}
