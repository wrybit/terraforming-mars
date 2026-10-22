import {Color} from '@/common/Color';
import {CardName} from '@/common/cards/CardName';
import {CardType} from '@/common/cards/CardType';
import {LogMessage} from '@/common/logs/LogMessage';
import {LogMessageDataType} from '@/common/logs/LogMessageDataType';
import {SpaceId} from '@/common/Types';
import {TileType} from '@/common/TileType';
import {getCard} from '@/client/cards/ClientCardManifest';

// Groups the server's log messages into rows: one row per action (card played, card action,
// standard project, milestone, trade, ...) with its follow-up effects as icons. Everything this model
// does not recognise stays a plain message row, so no information is ever lost.

export type LogEffect = {
  // Icon name (LogEffectIcon.vue / log.less): resources (megacredit, plant, card, tr, ...), colony, moon rates, planetary tracks
  resource?: string,
  amount: number,
  production?: boolean,
  // Tile image name (city, greenery, ocean, moon-mine, ..., special)
  tile?: string,
  // Underground token (Underworld), shown with its token image at its space
  token?: string,
  space?: SpaceId,
  // Resource placed on this card (not into the stock), e.g. science on Olympus Conference
  card?: CardName,
  // Card, global event or party whose effect caused this ("because of ..."), e.g. Mars Rover Development
  cause?: string,
  // What the icon stands for, shown in the hover summary (colony name)
  label?: string,
  // Paid to start the action (trade fleet fuel): stays apart from income of the same resource
  cost?: boolean,
};

export type LogActionKind = 'card' | 'action' | 'standardProject' | 'milestone' | 'award' | 'pass' | 'endTurn' | 'kept' |
  'fizzled' | 'trade' | 'delegate' | 'partyAction' | 'globalEvent' | 'turmoil';

export type LogAction = {
  kind: LogActionKind,
  // Undefined for the rows of the turmoil phase (global event, new government): they concern all players
  player?: Color,
  card?: CardName,
  // Milestone/award, colony (trade), party (delegate, party action), global event, or the number of kept cards
  name?: string,
  // Number of delegates sent
  count?: number,
  // The message that started the action: its cards, colonies and global events are what the hover preview shows
  lead: LogMessage,
  effects: Array<LogEffect>,
  // Effects on other players caused by this action (attacks and gains)
  others: Array<{player: Color, effects: Array<LogEffect>}>,
  // Effects on every player at once ("All players lose 1 TR.")
  everyone?: Array<LogEffect>,
  // Parties that got a neutral delegate (new government)
  parties?: Array<string>,
  // Text lines summarised by this row (ruling bonus and policy, new chairman), shown in the hover summary
  notes?: Array<LogMessage>,
};

export type LogRow =
  | {type: 'action', action: LogAction, indexes: Array<number>}
  | {type: 'research', entries: Array<{player: Color, amount: number}>, indexes: Array<number>}
  // follows: a consequence of the action row above (same player, e.g. the cards a card let them draw) – indented with ↳
  | {type: 'message', message: LogMessage, indexes: Array<number>, follows?: boolean}
  | {type: 'phase', indexes: Array<number>};

const PLAYED_WITH_PAYMENT = '${0} played ${1} [ ${2} ]';

const STARTERS: Record<string, LogActionKind> = {
  '${0} played ${1}': 'card',
  // Since upstream 973694909 with what was paid ("-3:r:megacredits: -1:r:steel:"): shown as cost icons on the right
  [PLAYED_WITH_PAYMENT]: 'card',
  '${0} used ${1} action': 'action',
  '${0} took the first action of ${1} corporation': 'action',
  '${0} used ${1} standard project': 'standardProject',
  '${0} used ${1} standard action': 'standardProject',
  '${0} claimed ${1} milestone': 'milestone',
  '${0} funded ${1} award': 'award',
  '${0} passed': 'pass',
  // Turn handed on after one action: a row of its own, otherwise a single-action turn looks like a missing move
  '${0} ended turn': 'endTurn',
  '${0} kept ${1} project cards': 'kept',
  '${0} fizzled. ${1} gains 15 M€.': 'fizzled',
  '${0} spent ${1} energy to trade with ${2}': 'trade',
  '${0} spent ${1} titanium to trade with ${2}': 'trade',
  // Since upstream 2cab7b413 the resource is an icon shortcode; the old keys stay for saved games
  '${0} spent ${1}:r:energy: to trade with ${2}': 'trade',
  '${0} spent ${1}:r:titanium: to trade with ${2}': 'trade',
  '${0} spent ${1} M€ to trade with ${2}': 'trade',
  '${0} spent 1 floater to trade with ${1}': 'trade',
  '${0} spent ${1} data from ${2} to trade with ${3}': 'trade',
  '${0} spent ${1} ${2} from ${3} to trade with ${4}': 'trade',
  '${0} traded with ${1}': 'trade',
  '${0} used ${1} action to trade with ${2}': 'trade',
  '${0} sent ${1} delegate(s) in ${2} area': 'delegate',
  '${0} used Turmoil ${1} action': 'partyAction',
  'Resolving global event ${0}': 'globalEvent',
  'All players lose 1 TR.': 'turmoil',
};

// Lines of the new government at the end of a generation: they join one turmoil row
const TURMOIL = new Set([
  'A neutral delegate is the new chairman.',
  'Greens are in power in the first generation.',
  '${0} is the new chairman and gains ${1} TR',
  '${0} is the new chairman',
  'The ruling bonus is: ${0}',
  'The ruling policy is: ${0}',
  'A neutral delegate was added to the ${0} party',
]);

// Lines that only announce what follows as its own message ("drew 1 card(s)", "gained 3 heat"): they join the action row
const TRIGGERS = new Set([
  '${0} removed a resource from ${1} to draw a card',
  '${0} removed a:cr:science: from ${1} to draw a card',
  '${0} automatically removed 3 data from ${1} to draw a card.',
  '${0} gained ${1} trade bonus',
]);

// Resource words of the log (lower case, without a plural "(s)") -> icon
const RESOURCES: Record<string, string> = {
  'm€': 'megacredit', 'megacredits': 'megacredit', 'plant': 'plant', 'plants': 'plant', 'steel': 'steel', 'titanium': 'titanium', 'energy': 'power', 'heat': 'heat',
  'animal': 'animal', 'animals': 'animal', 'microbe': 'microbe', 'microbes': 'microbe', 'floater': 'floater', 'floaters': 'floater',
  'science': 'science', 'asteroid': 'asteroid', 'asteroids': 'asteroid', 'fighter': 'fighter', 'data': 'data', 'camp': 'camp',
};
const TILES: Record<string, string> = {'city tile': 'city', 'greenery tile': 'greenery', 'ocean tile': 'ocean'};
const TILE_TYPES: Partial<Record<TileType, string>> = {
  [TileType.GREENERY]: 'greenery', [TileType.OCEAN]: 'ocean', [TileType.CITY]: 'city',
  [TileType.MOON_MINE]: 'moon-mine', [TileType.MOON_HABITAT]: 'moon-habitat', [TileType.MOON_ROAD]: 'moon-road',
};
// Production of standard projects that older servers did not log: added when the log has none
const STANDARD_PROJECT_PRODUCTION: Partial<Record<CardName, LogEffect>> = {
  [CardName.POWER_PLANT_STANDARD_PROJECT]: {resource: 'power', amount: 1, production: true},
  [CardName.CITY_STANDARD_PROJECT]: {resource: 'megacredit', amount: 1, production: true},
};
// Planetary tracks (Pathfinders) with a tag icon
const TRACKS = new Set(['venus', 'earth', 'mars', 'jovian', 'moon']);

function value(message: LogMessage, index: number): string | undefined {
  const datum = message.data[index];
  return datum === undefined ? undefined : String(datum.value);
}

function amount(message: LogMessage, index: number): number {
  return Number(value(message, index));
}

function firstPlayer(message: LogMessage): Color | undefined {
  return message.data.find((datum) => datum.type === LogMessageDataType.PLAYER)?.value as Color | undefined;
}

function playerAt(message: LogMessage, index: number): Color | undefined {
  const datum = message.data[index];
  return datum?.type === LogMessageDataType.PLAYER ? datum.value as Color : undefined;
}

function firstOfType(message: LogMessage, type: LogMessageDataType): string | undefined {
  const datum = message.data.find((entry) => entry.type === type);
  return datum === undefined ? undefined : String(datum.value);
}

function resource(word: string | undefined): string | undefined {
  return word === undefined ? undefined : RESOURCES[word.toLowerCase().replace(/\(s\)$/, '')];
}

// Card at a message position, if the server put a card there
function cardAt(message: LogMessage, index: number): CardName | undefined {
  const datum = message.data[index];
  return datum?.type === LogMessageDataType.CARD ? datum.value : undefined;
}

// Cause at a message position: a card, a global event or a party ("because of ${3}" may also name a player – no cause then)
function causeAt(message: LogMessage, index: number): string | undefined {
  const datum = message.data[index];
  // STRING: a rule of the game (placement bonus, adjacency bonus)
  const causes = [LogMessageDataType.CARD, LogMessageDataType.GLOBAL_EVENT, LogMessageDataType.PARTY, LogMessageDataType.STRING];
  return datum !== undefined && causes.includes(datum.type) ? String(datum.value) : undefined;
}

// Leaves out empty fields: the effect stays a plain object that compares equal in tests and merging
function effect(fields: LogEffect): LogEffect {
  return Object.fromEntries(Object.entries(fields).filter(([, field]) => field !== undefined)) as LogEffect;
}

// RESOURCE / PRODUCTION / CARD_RESOURCE datum (upstream 2cab7b413): the icon and whether it is production
function resourceDatum(message: LogMessage, index: number): {name: string | undefined, production: boolean} {
  const datum = message.data[index];
  return {name: resource(value(message, index)), production: datum?.type === LogMessageDataType.PRODUCTION};
}

function withResource(name: string | undefined, fields: Omit<LogEffect, 'resource'>): LogEffect | undefined {
  return name === undefined ? undefined : effect({...fields, resource: name});
}

type PlayerEffect = {player: Color, effect: LogEffect};

// One follow-up message as effects, each with the player it affects. Empty: not recognised.
export function effectsOf(message: LogMessage): Array<PlayerEffect> {
  const template = message.message;
  const player = firstPlayer(message);
  const n = amount(message, 1);
  const one = (fields: LogEffect | undefined, who: Color | undefined = player): Array<PlayerEffect> =>
    who === undefined || fields === undefined || (fields.tile === undefined && fields.token === undefined && Number.isNaN(fields.amount)) ? [] : [{player: who, effect: fields}];
  switch (template) {
  case '${0} gained ${1} ${2} production':
    return one(withResource(resource(value(message, 2)), {amount: n, production: true}));
  case '${0} gained ${1} ${2} production because of ${3}':
    return one(withResource(resource(value(message, 2)), {amount: n, production: true, cause: causeAt(message, 3)}));
  case '${0} lost ${1} ${2} production':
    return one(withResource(resource(value(message, 2)), {amount: -n, production: true}));
  case '${0} lost ${1} ${2} production because of ${3}':
    return one(withResource(resource(value(message, 2)), {amount: -n, production: true, cause: causeAt(message, 3)}));
  case '${3} stole ${1} ${2} production from ${0}':
    // The victim is ${0}; the thief's gain follows as its own message
    return one(withResource(resource(value(message, 2)), {amount: -n, production: true}), playerAt(message, 0));
  case '${0} gained ${1}${2}':
  case '${0} gained ${1}${2} because of ${3}':
  case '${0} lost ${1}${2}':
  case '${0} lost ${1}${2} because of ${3}': {
    const {name, production} = resourceDatum(message, 2);
    const sign = template.startsWith('${0} lost') ? -1 : 1;
    const cause = template.endsWith('because of ${3}') ? causeAt(message, 3) : undefined;
    return one(withResource(name, {amount: sign * n, ...(production ? {production} : {}), ...(cause !== undefined ? {cause} : {})}));
  }
  case '${3} stole ${1} ${2} from ${0}': {
    if (message.data[2]?.type === LogMessageDataType.PRODUCTION) {
      // Stolen production: the victim is ${0}; the thief's gain follows as its own message
      return one(withResource(resource(value(message, 2)), {amount: -n, production: true}), playerAt(message, 0));
    }
    // No separate message for the thief: the victim loses, the thief gains
    const stolen = resource(value(message, 2));
    return [...one(withResource(stolen, {amount: -n}), playerAt(message, 0)), ...one(withResource(stolen, {amount: n}), playerAt(message, 3))];
  }
  case '${0} gained ${1} ${2}':
    return one(withResource(resource(value(message, 2)), {amount: n}));
  case '${0} gained ${1} ${2} because of ${3}':
    return one(withResource(resource(value(message, 2)), {amount: n, cause: causeAt(message, 3)}));
  case '${0} lost ${1} ${2} because of ${3}':
    return one(withResource(resource(value(message, 2)), {amount: -n, cause: causeAt(message, 3)}));
  case '${0} gained 2 ${1} from ${2}':
    return one(withResource(resource(value(message, 1)), {amount: 2, cause: causeAt(message, 2)}));
  case '${0} gained 2:r:plants: from ${1}':
    return one(effect({resource: 'plant', amount: 2, cause: causeAt(message, 1)}));
  case '${0} gained ${1} M€ from ${2} ocean(s)':
    return one(effect({resource: 'megacredit', amount: n, cause: 'adjacent oceans'}));
  case '${0} received ${1} M€ from ${2} owner (${3})':
    return one(effect({resource: 'megacredit', amount: n, cause: causeAt(message, 2)}));
  case '${0} gained 4 M€ for playing ${1}, which has no tags.':
    return one(effect({resource: 'megacredit', amount: 4}));
  case '${0} gained 1 M€ for playing ${1}, which has exactly 1 tag.':
    return one(effect({resource: 'megacredit', amount: 1}));
  case '${0} gained ${1} TR':
    return one(effect({resource: 'tr', amount: n}));
  case '${0} gained ${1} TR from ${2}':
    return one(effect({resource: 'tr', amount: n, cause: causeAt(message, 2)}));
  case '${0} lost ${1} TR':
    return one(effect({resource: 'tr', amount: -n}));
  case '${0} is the new chairman and gains ${1} TR':
    return one(effect({resource: 'tr', amount: n}));
  case '${0} gained ${1} corruption':
    return one(effect({resource: 'corruption', amount: n}));
  case '${0} spent ${1} corruption':
    return one(effect({resource: 'corruption', amount: -n}));
  case '${0} ${1} ${2} at ${3}':
    return one({tile: TILES[value(message, 2) ?? ''] ?? 'special', space: value(message, 3) as SpaceId, amount: 0});
  case '${0} placed a ${1} tile at ${2}':
    return one({tile: TILE_TYPES[amount(message, 1) as TileType] ?? 'special', space: value(message, 2) as SpaceId, amount: 0});
  case '${0} excavated ${1} at ${2}':
  case '${0} claimed ${1} at ${2}':
    // Both lines name the same token; mergeEffects keeps one
    return one({token: value(message, 1), space: value(message, 2) as SpaceId, amount: 0});
  case '${0} built a colony on ${1}':
    return one(effect({resource: 'colony', amount: 1, label: value(message, 1)}));
  case '${0} increased Venus scale ${1} step(s)':
    return one(effect({resource: 'venus', amount: n}));
  case '${0} raised the ${1} planetary track ${2} step(s)': {
    const track = value(message, 1)?.toLowerCase();
    return track !== undefined && TRACKS.has(track) ? one(effect({resource: 'track-' + track, amount: amount(message, 2)})) : [];
  }
  case '${0} raised the habitat rate ${1} step(s)':
    return one(effect({resource: 'habitat-rate', amount: n}));
  case '${0} raised the mining rate ${1} step(s)':
    return one(effect({resource: 'mining-rate', amount: n}));
  case '${0} raised the logistic rate ${1} step(s)':
    return one(effect({resource: 'logistic-rate', amount: n}));
  case '${0} lowered the habitat rate ${1} step(s)':
    return one(effect({resource: 'habitat-rate', amount: -n}));
  case '${0} lowered the mining rate ${1} step(s)':
    return one(effect({resource: 'mining-rate', amount: -n}));
  case '${0} lowered the logistic rate ${1} step(s)':
    return one(effect({resource: 'logistic-rate', amount: -n}));
  case '${0} added ${1}${2} to ${3}':
  case '${0} added ${1} ${2} to ${3}':
    return one(withResource(resource(value(message, 2)), {amount: n, card: cardAt(message, 3)}));
  case '${0} ${1} ${2} card(s)':
    return one(effect({resource: 'card', amount: amount(message, 2)}));
  case '${0} is using their ${1} effect to draw a card by discarding a card.':
    // Discard one, draw one (the draw follows as "drew 1 card(s)")
    return one(effect({resource: 'card', amount: -1}));
  case '${0} sold ${1} patents':
    // Follows the "Sell patents" standard project: the cards given away
    return one(effect({resource: 'card', amount: -n}));
  default:
    return [];
  }
}

// First effect of a message (kept for callers that expect one effect per message)
export function effectOf(message: LogMessage): PlayerEffect | undefined {
  return effectsOf(message)[0];
}

// Same resource of the same kind adds up (3x +4 M€ -> +12 M€); fixed order production, stock, tiles,
// so the same things stand in the same place in every row
export function mergeEffects(effects: ReadonlyArray<LogEffect>): Array<LogEffect> {
  const merged: Array<LogEffect> = [];
  for (const next of effects) {
    // Only the same thing adds up: same resource, kind, card it lies on, cause and label
    const same = next.resource !== undefined && merged.find((other) => other.resource === next.resource &&
      Boolean(other.production) === Boolean(next.production) && other.card === next.card && other.cause === next.cause && other.label === next.label &&
      Boolean(other.cost) === Boolean(next.cost));
    // An underground token is named twice (excavated, claimed): show it once
    const sameToken = next.token !== undefined && merged.some((other) => other.token === next.token && other.space === next.space);
    if (same) {
      same.amount += next.amount;
    } else if (!sameToken) {
      merged.push({...next});
    }
  }
  const placed = (entry: LogEffect) => entry.tile !== undefined || entry.token !== undefined;
  const rank = (entry: LogEffect) => placed(entry) ? 2 : entry.production ? 0 : 1;
  return merged.filter((entry) => placed(entry) || entry.amount !== 0).sort((a, b) => rank(a) - rank(b));
}

type Phase = 'corporation' | 'prelude' | 'turns';

function phaseOf(row: LogRow): Phase | undefined {
  if (row.type !== 'action') {
    return undefined;
  }
  const action = row.action;
  if (action.kind === 'kept') {
    return 'corporation';
  }
  if ((action.kind === 'card' || action.kind === 'fizzled') && action.card !== undefined) {
    const type = getCard(action.card)?.type;
    if (type === CardType.CORPORATION) {
      return 'corporation';
    }
    if (type === CardType.PRELUDE) {
      return 'prelude';
    }
  }
  return 'turns';
}

// What the row of a starting message shows: player, card, name and the cost already known from this message
function startAction(kind: LogActionKind, message: LogMessage): LogAction | undefined {
  const template = message.message;
  const player = firstPlayer(message);
  const action: LogAction = {kind, player, lead: message, effects: [], others: []};
  switch (kind) {
  case 'globalEvent':
    action.name = firstOfType(message, LogMessageDataType.GLOBAL_EVENT);
    return action;
  case 'turmoil':
    // "All players lose 1 TR." opens the turmoil phase
    action.everyone = [{resource: 'tr', amount: -1}];
    return action;
  case 'fizzled':
    // The prelude could not be played: its owner gets 15 M€ instead
    return player === undefined ? undefined : {...action, card: cardAt(message, 0), effects: [{resource: 'megacredit', amount: 15}]};
  default:
    break;
  }
  if (player === undefined) {
    return undefined;
  }
  action.card = firstOfType(message, LogMessageDataType.CARD) as CardName | undefined;
  switch (kind) {
  case 'kept':
  case 'milestone':
  case 'award':
  case 'partyAction':
    action.name = value(message, 1);
    break;
  case 'delegate':
    action.name = value(message, 2);
    action.count = amount(message, 1);
    break;
  case 'card':
    if (template === PLAYED_WITH_PAYMENT) {
      action.effects.push(...paymentEffects(value(message, 2)));
    }
    break;
  case 'trade': {
    action.name = firstOfType(message, LogMessageDataType.COLONY);
    // The trade fleet's fuel: energy, titanium, M€, or resources from a card
    const spent = /^\$\{0\} spent (\$\{1\}|1) (\S+) (from \$\{\d\} )?to trade/.exec(template);
    if (spent !== null) {
      const count = spent[1] === '1' ? 1 : amount(message, 1);
      const word = spent[2] === '${2}' ? value(message, 2) : spent[2];
      const paid = withResource(resource(word), {amount: -count, cost: true, card: spent[3] !== undefined ? cardAt(message, spent[2] === '${2}' ? 3 : 2) : undefined});
      if (paid !== undefined) {
        action.effects.push(paid);
      }
    }
    break;
  }
  default:
    break;
  }
  return action;
}

// Payment of a played card as the server logs it (Payment.toLogString): "-3:r:megacredits: -1:cr:microbe:", "0" when free.
// Each part becomes a cost icon; an unknown resource keeps its place as nothing rather than breaking the row.
function paymentEffects(payment: string | undefined): Array<LogEffect> {
  const effects: Array<LogEffect> = [];
  for (const part of (payment ?? '').matchAll(/-(\d+):c?r:([a-z]+):/gi)) {
    const paid = withResource(resource(part[2]), {amount: -Number(part[1]), cost: true});
    if (paid !== undefined) {
      effects.push(paid);
    }
  }
  return effects;
}

// Base cost of what the action paid for (card or standard project), undefined when unknown
function paidCost(action: LogAction): number | undefined {
  if ((action.kind !== 'card' && action.kind !== 'standardProject') || action.card === undefined) {
    return undefined;
  }
  return getCard(action.card)?.cost;
}

// Older logs name no cause for corporation effects: attach it where the rule is unambiguous.
// CrediCor: +4 M€ after paying a card or standard project with a base cost of 20 M€ or more.
function addLegacyCauses(action: LogAction, context: LogContext): void {
  const player = action.player;
  const tableau = player === undefined ? undefined : context.tableau?.[player];
  if (tableau === undefined || !tableau.includes(CardName.CREDICOR) || (paidCost(action) ?? 0) < 20) {
    return;
  }
  if (action.effects.some((entry) => entry.cause === CardName.CREDICOR)) {
    return;
  }
  const refund = action.effects.find((entry) => entry.resource === 'megacredit' && entry.amount === 4 && !entry.production && entry.cause === undefined && entry.card === undefined);
  if (refund !== undefined) {
    refund.cause = CardName.CREDICOR;
  }
}

function withoutCause(entry: LogEffect): LogEffect {
  const copy = {...entry};
  delete copy.cause;
  return copy;
}

function addEffect(action: LogAction, entry: PlayerEffect): void {
  if (action.player !== undefined && entry.player === action.player) {
    action.effects.push(entry.effect);
    return;
  }
  const other = action.others.find((candidate) => candidate.player === entry.player);
  if (other !== undefined) {
    other.effects.push(entry.effect);
  } else {
    action.others.push({player: entry.player, effects: [entry.effect]});
  }
}

// Messages of one generation (without the generation line) -> rows
// Cards each player has in play: lets older logs (before the server named the cause) still explain corporation effects
export type LogContext = {tableau?: Partial<Record<Color, ReadonlyArray<CardName>>>};

export function groupLogMessages(messages: ReadonlyArray<LogMessage>, context: LogContext = {}): Array<LogRow> {
  const rows: Array<LogRow> = [];
  let current: (LogRow & {type: 'action'}) | undefined;
  let research: (LogRow & {type: 'research'}) | undefined;
  let actionsStarted = false;

  const start = (action: LogAction, index: number) => {
    current = {type: 'action', action, indexes: [index]};
    rows.push(current);
  };

  messages.forEach((message, index) => {
    const template = message.message;
    // Card purchase at the start of a generation: one summary row
    if (!actionsStarted && template === '${0} ${1} ${2} card(s)' && value(message, 1) === 'bought') {
      const player = firstPlayer(message);
      if (player !== undefined) {
        if (research === undefined) {
          research = {type: 'research', entries: [], indexes: []};
          rows.push(research);
        }
        research.entries.push({player, amount: amount(message, 2)});
        research.indexes.push(index);
        current = undefined;
        return;
      }
    }
    const kind = STARTERS[template];
    const started = kind === undefined ? undefined : startAction(kind, message);
    // Several delegates in a row into the same party (lobby, then reserve): one row with the total
    const previous = current?.action;
    if (started?.kind === 'delegate' && previous?.kind === 'delegate' && previous.player === started.player && previous.name === started.name) {
      previous.count = (previous.count ?? 1) + (started.count ?? 1);
      current?.indexes.push(index);
      return;
    }
    if (kind !== undefined && started !== undefined) {
      if (kind !== 'kept') {
        actionsStarted = true;
      }
      start(started, index);
      return;
    }
    // New government: chairman, ruling bonus and policy, neutral delegates – one row with notes
    if (TURMOIL.has(template)) {
      let government = current;
      if (government?.action.kind === 'turmoil') {
        government.indexes.push(index);
      } else {
        government = {type: 'action', action: {kind: 'turmoil', lead: message, effects: [], others: []}, indexes: [index]};
        current = government;
        rows.push(government);
      }
      const action = government.action;
      if (template === 'A neutral delegate was added to the ${0} party') {
        (action.parties ??= []).push(value(message, 0) ?? '');
      } else {
        (action.notes ??= []).push(message);
      }
      effectsOf(message).forEach((entry) => addEffect(action, entry));
      return;
    }
    if (current !== undefined && TRIGGERS.has(template)) {
      current.indexes.push(index);
      return;
    }
    const effects = current === undefined ? [] : effectsOf(message);
    if (current !== undefined && effects.length > 0) {
      const action = current.action;
      effects.forEach((entry) => addEffect(action, entry));
      current.indexes.push(index);
      return;
    }
    // End of the game: the game id stands apart below a divider
    if (template === 'This game id was ${0}') {
      rows.push({type: 'phase', indexes: []});
    }
    // Not recognised: a plain line. It ends the current action, so later effects don't attach to the wrong row –
    // except private notes ("Jens drew …"), which come between an action and its effects
    const follows = current !== undefined && current.action.player !== undefined && firstPlayer(message) === current.action.player;
    if (!message.data.some((datum) => datum.type === LogMessageDataType.CARDS)) {
      current = undefined;
    }
    rows.push(follows ? {type: 'message', message, indexes: [index], follows: true} : {type: 'message', message, indexes: [index]});
  });

  for (const row of rows) {
    if (row.type === 'action') {
      addLegacyCauses(row.action, context);
      const known = row.action.kind === 'standardProject' && row.action.card !== undefined ? STANDARD_PROJECT_PRODUCTION[row.action.card] : undefined;
      if (known !== undefined && !row.action.effects.some((entry) => entry.production && entry.resource === known.resource)) {
        row.action.effects.push({...known});
      }
      // The server names the running card as cause; the row's own card needs no "because of" itself
      const ownCard = row.action.card;
      const withoutOwnCause = (effects: Array<LogEffect>) => effects.map((entry) => entry.cause !== undefined && entry.cause === ownCard ? withoutCause(entry) : entry);
      row.action.effects = mergeEffects(withoutOwnCause(row.action.effects));
      row.action.others = row.action.others.map((entry) => ({player: entry.player, effects: mergeEffects(withoutOwnCause(entry.effects))}));
    }
  }
  return withPhaseLines(rows);
}

// Divider after the card purchase, and in generation 1 after the corporations and after the preludes
function withPhaseLines(rows: Array<LogRow>): Array<LogRow> {
  const result: Array<LogRow> = [];
  let previous: Phase | 'research' | undefined;
  for (const row of rows) {
    const phase = row.type === 'research' ? 'research' : phaseOf(row);
    if (phase !== undefined) {
      if (previous !== undefined && previous !== phase) {
        result.push({type: 'phase', indexes: []});
      }
      previous = phase;
    }
    result.push(row);
  }
  return result;
}
