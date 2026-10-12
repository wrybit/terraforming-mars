import {Color} from '@/common/Color';
import {CardName} from '@/common/cards/CardName';
import {CardType} from '@/common/cards/CardType';
import {LogMessage} from '@/common/logs/LogMessage';
import {LogMessageDataType} from '@/common/logs/LogMessageDataType';
import {SpaceId} from '@/common/Types';
import {getCard} from '@/client/cards/ClientCardManifest';

// Groups the server's log messages into rows: one row per action (card played, card action,
// standard project, milestone, ...) with its follow-up effects as icons. Everything this model
// does not recognise stays a plain message row, so no information is ever lost.

export type LogEffect = {
  // Resource image name in assets/resources (megacredit, plant, card, ...)
  resource?: string,
  amount: number,
  production?: boolean,
  // Tile image name in assets/tiles (city, greenery, ocean, special)
  tile?: string,
  space?: SpaceId,
};

export type LogActionKind = 'card' | 'action' | 'standardProject' | 'milestone' | 'award' | 'pass' | 'kept';

export type LogAction = {
  kind: LogActionKind,
  player: Color,
  card?: CardName,
  // Milestone/award name, or the number of kept cards
  name?: string,
  // The message that started the action: its cards are what the hover preview shows
  lead: LogMessage,
  effects: Array<LogEffect>,
  // Effects on other players caused by this action (attacks and gains)
  others: Array<{player: Color, effects: Array<LogEffect>}>,
};

export type LogRow =
  | {type: 'action', action: LogAction, indexes: Array<number>}
  | {type: 'research', entries: Array<{player: Color, amount: number}>, indexes: Array<number>}
  | {type: 'message', message: LogMessage, indexes: Array<number>}
  | {type: 'phase', indexes: Array<number>};

const STARTERS: Record<string, LogActionKind> = {
  '${0} played ${1}': 'card',
  '${0} used ${1} action': 'action',
  '${0} took the first action of ${1} corporation': 'action',
  '${0} used ${1} standard project': 'standardProject',
  '${0} used ${1} standard action': 'standardProject',
  '${0} claimed ${1} milestone': 'milestone',
  '${0} funded ${1} award': 'award',
  '${0} passed': 'pass',
  '${0} kept ${1} project cards': 'kept',
};

// Silent bookkeeping lines: the row layout already shows them
const HIDDEN = new Set(['${0} ended turn']);

// Card effects that trigger during an action and draw a card: the draw follows as its own message ("drew 1 card(s)"),
// so the trigger line only joins the action row
const TRIGGERS = new Set([
  '${0} removed a resource from ${1} to draw a card',
  '${0} automatically removed 3 data from ${1} to draw a card.',
]);

// Resource words of the log (lower case, without a plural "(s)") -> image in assets/resources
const RESOURCES: Record<string, string> = {
  'm€': 'megacredit', 'plant': 'plant', 'plants': 'plant', 'steel': 'steel', 'titanium': 'titanium', 'energy': 'power', 'heat': 'heat',
  'animal': 'animal', 'animals': 'animal', 'microbe': 'microbe', 'microbes': 'microbe', 'floater': 'floater', 'floaters': 'floater',
  'science': 'science', 'asteroid': 'asteroid', 'asteroids': 'asteroid', 'fighter': 'fighter', 'data': 'data', 'camp': 'camp',
};
const TILES: Record<string, string> = {'city tile': 'city', 'greenery tile': 'greenery', 'ocean tile': 'ocean'};

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

function resource(word: string | undefined): string | undefined {
  return word === undefined ? undefined : RESOURCES[word.toLowerCase().replace(/\(s\)$/, '')];
}

function withResource(name: string | undefined, effect: Omit<LogEffect, 'resource'>): LogEffect | undefined {
  return name === undefined ? undefined : {...effect, resource: name};
}

// One follow-up message as an effect, together with the player it affects. Undefined: not recognised.
export function effectOf(message: LogMessage): {player: Color, effect: LogEffect} | undefined {
  const template = message.message;
  let player = firstPlayer(message);
  let effect: LogEffect | undefined;
  switch (template) {
  case '${0} gained ${1} ${2} production':
  case '${0} gained ${1} ${2} production because of ${3}':
    effect = withResource(resource(value(message, 2)), {amount: amount(message, 1), production: true});
    break;
  case '${0} lost ${1} ${2} production':
  case '${0} lost ${1} ${2} production because of ${3}':
    effect = withResource(resource(value(message, 2)), {amount: -amount(message, 1), production: true});
    break;
  case '${3} stole ${1} ${2} production from ${0}':
    // The victim is ${0}; the thief's gain follows as its own message
    player = message.data[0]?.value as Color | undefined;
    effect = withResource(resource(value(message, 2)), {amount: -amount(message, 1), production: true});
    break;
  case '${0} gained ${1} ${2}':
  case '${0} gained ${1} ${2} because of ${3}':
    effect = withResource(resource(value(message, 2)), {amount: amount(message, 1)});
    break;
  case '${0} lost ${1} ${2} because of ${3}':
    effect = withResource(resource(value(message, 2)), {amount: -amount(message, 1)});
    break;
  case '${0} gained ${1} M€ from ${2} ocean(s)':
    effect = {resource: 'megacredit', amount: amount(message, 1)};
    break;
  case '${0} ${1} ${2} at ${3}':
    effect = {tile: TILES[value(message, 2) ?? ''] ?? 'special', space: value(message, 3) as SpaceId, amount: 0};
    break;
  case '${0} added ${1} ${2} to ${3}':
    effect = withResource(resource(value(message, 2)), {amount: amount(message, 1)});
    break;
  case '${0} ${1} ${2} card(s)':
    effect = {resource: 'card', amount: amount(message, 2)};
    break;
  case '${0} is using their ${1} effect to draw a card by discarding a card.':
    // Discard one, draw one (the draw follows as "drew 1 card(s)")
    effect = {resource: 'card', amount: -1};
    break;
  case '${0} sold ${1} patents':
    // Follows the "Sell patents" standard project: the cards given away
    effect = {resource: 'card', amount: -amount(message, 1)};
    break;
  default:
    return undefined;
  }
  return player === undefined || effect === undefined || (effect.tile === undefined && Number.isNaN(effect.amount)) ? undefined : {player, effect};
}

// Same resource of the same kind adds up (3x +4 M€ -> +12 M€); fixed order production, stock, tiles,
// so the same things stand in the same place in every row
export function mergeEffects(effects: ReadonlyArray<LogEffect>): Array<LogEffect> {
  const merged: Array<LogEffect> = [];
  for (const effect of effects) {
    const same = effect.resource !== undefined && merged.find((other) => other.resource === effect.resource && Boolean(other.production) === Boolean(effect.production));
    if (same) {
      same.amount += effect.amount;
    } else {
      merged.push({...effect});
    }
  }
  const rank = (effect: LogEffect) => effect.tile !== undefined ? 2 : effect.production ? 0 : 1;
  return merged.filter((effect) => effect.tile !== undefined || effect.amount !== 0).sort((a, b) => rank(a) - rank(b));
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
  if (action.kind === 'card' && action.card !== undefined) {
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

// Messages of one generation (without the generation line) -> rows
export function groupLogMessages(messages: ReadonlyArray<LogMessage>): Array<LogRow> {
  const rows: Array<LogRow> = [];
  let current: (LogRow & {type: 'action'}) | undefined;
  let research: (LogRow & {type: 'research'}) | undefined;
  let actionsStarted = false;

  messages.forEach((message, index) => {
    const template = message.message;
    if (HIDDEN.has(template)) {
      (current ?? rows[rows.length - 1])?.indexes.push(index);
      return;
    }
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
    const player = firstPlayer(message);
    if (kind !== undefined && player !== undefined) {
      if (kind !== 'kept') {
        actionsStarted = true;
      }
      const card = message.data.find((datum) => datum.type === LogMessageDataType.CARD)?.value as CardName | undefined;
      const name = kind === 'kept' ? value(message, 1) : kind === 'milestone' || kind === 'award' ? value(message, 1) : undefined;
      current = {type: 'action', action: {kind, player, card, name, lead: message, effects: [], others: []}, indexes: [index]};
      rows.push(current);
      return;
    }
    if (current !== undefined && TRIGGERS.has(template)) {
      current.indexes.push(index);
      return;
    }
    const effect = current === undefined ? undefined : effectOf(message);
    if (current !== undefined && effect !== undefined) {
      const action = current.action;
      if (effect.player === action.player) {
        action.effects.push(effect.effect);
      } else {
        const other = action.others.find((entry) => entry.player === effect.player);
        if (other !== undefined) {
          other.effects.push(effect.effect);
        } else {
          action.others.push({player: effect.player, effects: [effect.effect]});
        }
      }
      current.indexes.push(index);
      return;
    }
    // Not recognised: a plain line. It ends the current action, so later effects don't attach to the wrong row –
    // except private notes ("You drew …"), which come between an action and its effects
    if (!message.data.some((datum) => datum.type === LogMessageDataType.CARDS)) {
      current = undefined;
    }
    rows.push({type: 'message', message, indexes: [index]});
  });

  for (const row of rows) {
    if (row.type === 'action') {
      row.action.effects = mergeEffects(row.action.effects);
      row.action.others = row.action.others.map((entry) => ({player: entry.player, effects: mergeEffects(entry.effects)}));
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
