import {CardName} from '@/common/cards/CardName';
import {CardType} from '@/common/cards/CardType';
import {Color} from '@/common/Color';
import {LogMessageType} from '@/common/logs/LogMessageType';
import {ReplaySourceMessage, ReplaySourceModel} from '@/common/models/ReplaySourceModel';
import {SpaceId} from '@/common/Types';
import {TileType} from '@/common/TileType';
import {getCard} from '@/client/cards/ClientCardManifest';
import {actionCost, costsOnPlay, globalItems, productionBox, RESOURCE_COUNT, ResourceIndex} from './replayCardRules';

// Reconstructs a finished game line by line from its start, its end and its log (api/replay), so nothing has to be
// stored for a replay. Exact where the log says it (played cards, tiles, production, TR, parameters, hand size);
// estimated where it doesn't: how a card was paid (steel/titanium first), which unnamed starting cards were sold.
// Measured against fully saved games: resources are off by about 2 M€ on average, everything else is exact.

export type ReplayTile = {space: SpaceId, tileType: TileType, color?: Color};

export type ReplayPlayerState = {
  terraformRating: number,
  // M€, steel, titanium, plants, energy, heat
  resources: Array<number>,
  production: Array<number>,
  hand: Array<CardName>,
  // Kept starting cards whose names older logs don't tell
  unknownHand: number,
  played: Array<CardName>,
  cardResources: Partial<Record<CardName, number>>,
  actionsThisGeneration: Array<CardName>,
};

export type ReplayState = {
  generation: number,
  temperature: number,
  oxygenLevel: number,
  oceans: number,
  tiles: Array<ReplayTile>,
  milestones: Array<{name: string, color: Color}>,
  awards: Array<{name: string, color: Color}>,
  passed: Array<Color>,
  // Player of the last line (who is acting)
  active: Color | undefined,
  players: Array<ReplayPlayerState>,
};

const RESOURCE_WORDS: Record<string, ResourceIndex> = {
  'M€': 0, 'megacredits': 0, 'steel': 1, 'titanium': 2, 'plant': 3, 'plants': 3, 'energy': 4, 'heat': 5,
};
const STANDARD_PROJECT_COST: Record<string, number> = {'Power Plant': 11, 'Asteroid': 14, 'Aquifer': 18, 'Greenery': 23, 'City': 25};
const AWARD_COSTS = [8, 14, 20];
const MILESTONE_COST = 8;
const MAX_TEMPERATURE = 8;
const MAX_OXYGEN = 14;
const OXYGEN_TEMPERATURE_BONUS = 8;
const RESEARCH_CARD_COST = 3;
const INDENTURED_WORKERS_DISCOUNT = 8;
const ACQUIRE_MESSAGES = new Set(['You bought ${0}', '${0} bought ${1}', '${0} drew ${1}']);
const ACTION_LINES = new Set(['${0} used ${1} action', '${0} played ${1}', '${0} used ${1} standard project', '${0} used ${1} standard action', '${0} passed']);
// After these lines a printed production box can no longer be "the same" as a logged production line
const BLOCK_STARTS = new Set([...ACTION_LINES, '${0} ended turn', 'Generation ${0}', '${0} claimed ${1} milestone', '${0} funded ${1} award']);

type PlayerWork = ReplayPlayerState & {
  discounts: Array<{tag: string | undefined, amount: number}>,
  nextCardDiscount: number,
  steelValue: number,
  titaniumValue: number,
};

type Trace = {
  acquired: Array<{player: number, card: CardName, line: number}>,
  sells: Array<{line: number, player: number, count: number}>,
};

const valueOf = (message: ReplaySourceMessage, index: number): unknown => message.data[index]?.value;
const stringOf = (message: ReplaySourceMessage, index: number): string => String(valueOf(message, index) ?? '');
const numberOf = (message: ReplaySourceMessage, index: number): number => Number(valueOf(message, index) ?? 0);
const cardsOf = (value: unknown): Array<CardName> => (Array.isArray(value) ? value : [value]).filter((card) => typeof card === 'string') as Array<CardName>;

function cardCost(player: PlayerWork, name: CardName): {cost: number, tags: ReadonlyArray<string>} {
  const card = getCard(name);
  const tags: ReadonlyArray<string> = card?.tags ?? [];
  let cost = card?.cost ?? 0;
  for (const discount of player.discounts) {
    if (discount.tag === undefined || tags.includes(discount.tag)) {
      cost -= discount.amount;
    }
  }
  return {cost: Math.max(0, cost), tags};
}

// The log doesn't say how a card was paid: steel or titanium first like most players do, the rest in M€
function pay(player: PlayerWork, amount: number, tags: ReadonlyArray<string>): void {
  let cost = amount;
  if (tags.includes('building') && player.resources[1] > 0) {
    const used = Math.min(player.resources[1], Math.floor(cost / player.steelValue));
    player.resources[1] -= used;
    cost -= used * player.steelValue;
  }
  if (tags.includes('space') && player.resources[2] > 0) {
    const used = Math.min(player.resources[2], Math.floor(cost / player.titaniumValue));
    player.resources[2] -= used;
    cost -= used * player.titaniumValue;
  }
  player.resources[0] -= cost;
}

function removeOnce<T>(list: Array<T>, item: T): boolean {
  const index = list.indexOf(item);
  if (index >= 0) {
    list.splice(index, 1);
  }
  return index >= 0;
}

function snapshot(player: PlayerWork): ReplayPlayerState {
  return {
    terraformRating: player.terraformRating,
    resources: [...player.resources],
    production: [...player.production],
    hand: [...player.hand],
    unknownHand: player.unknownHand,
    played: [...player.played],
    cardResources: {...player.cardResources},
    actionsThisGeneration: [...player.actionsThisGeneration],
  };
}

function reconstructPass(source: ReplaySourceModel, sales: Map<number, Array<CardName>>): {states: Array<ReplayState>, players: Array<PlayerWork>, trace: Trace} {
  const log = source.log;
  const colorIndex = new Map<Color, number>(source.players.map((player, index) => [player.color, index]));
  const players: Array<PlayerWork> = source.players.map((player) => ({
    terraformRating: player.startTerraformRating,
    resources: new Array(RESOURCE_COUNT).fill(0),
    production: new Array(RESOURCE_COUNT).fill(0),
    hand: [], unknownHand: 0, played: [], cardResources: {}, actionsThisGeneration: [],
    discounts: [], nextCardDiscount: 0, steelValue: 2, titaniumValue: 3,
  }));
  const tiles = new Map<SpaceId, ReplayTile>();
  const parameters = {temperature: source.startTemperature, oxygenLevel: source.startOxygenLevel, oceans: 0};
  const milestones: Array<{name: string, color: Color}> = [];
  const awards: Array<{name: string, color: Color}> = [];
  let passed: Array<Color> = [];
  let active: Color | undefined;
  let generation = 1;
  let finalPhase = false;
  const trace: Trace = {acquired: [], sells: []};
  const states: Array<ReplayState> = [];

  const endTileTypes = new Map(source.endTiles.map((tile) => [tile.space, tile.tileType]));
  // Tiles outside Mars (Phobos, Ganymede ...) are placed by their card without a log line of their own
  const loggedSpaces = new Set(log.filter((message) => message.message === '${0} ${1} ${2} at ${3}').map((message) => stringOf(message, 3)));
  const silentTiles = new Map(source.endTiles.flatMap((tile) => tile.card !== undefined && !loggedSpaces.has(tile.space) ? [[tile.card, tile] as const] : []));
  // Cards a player plays or still holds at the end without buying or drawing them later: they kept them at the start
  const laterCards = source.players.map((player) => {
    const acquiredLater = new Set(log.filter((message) => message.viewer === player.color && ACQUIRE_MESSAGES.has(message.message))
      .flatMap((message) => cardsOf(message.data[message.data.length - 1]?.value)));
    const playedOrHeld = new Set([...log.filter((message) => message.message === '${0} played ${1}' && stringOf(message, 0) === player.color)
      .map((message) => stringOf(message, 1) as CardName), ...player.endHand]);
    return new Set([...playedOrHeld].filter((card) => !acquiredLater.has(card)));
  });
  const firstBuy = new Map<number, number>();
  let pendingBox: {player: number | undefined, delta: Map<ResourceIndex, number>} = {player: undefined, delta: new Map()};
  let pendingStandardProject: {player: number, index: ResourceIndex} | undefined;
  let pendingTr: {player: number | undefined, amount: number} = {player: undefined, amount: 0};

  const raise = (kind: 'temperature' | 'oxygen', steps: number, who: number | undefined): void => {
    // Limits as in the game; every real step gives the player 1 TR
    for (let step = 0; step < steps; step++) {
      if (kind === 'temperature' && parameters.temperature < MAX_TEMPERATURE) {
        parameters.temperature += 2;
        if (who !== undefined) {
          players[who].terraformRating++;
        }
      } else if (kind === 'oxygen' && parameters.oxygenLevel < MAX_OXYGEN) {
        parameters.oxygenLevel++;
        if (who !== undefined) {
          players[who].terraformRating++;
        }
        if (parameters.oxygenLevel === OXYGEN_TEMPERATURE_BONUS) {
          raise('temperature', 1, who);
        }
      }
    }
  };
  // A blue card with resources has two actions: add a resource OR spend some to raise a parameter.
  // Only when the log then removes resources from this card it was the raising action.
  const removesFromCard = (line: number, card: string): boolean => {
    for (const following of log.slice(line + 1, line + 6)) {
      if (ACTION_LINES.has(following.message)) {
        return false;
      }
      if (following.message.includes('removed') && following.data.some((data) => data.value === card)) {
        return true;
      }
    }
    return false;
  };
  const plantsForGreenery = (player: PlayerWork) => player.played.includes(CardName.ECOLINE) ? 7 : 8;

  log.forEach((message, line) => {
    const text = message.message;
    if (BLOCK_STARTS.has(text)) {
      pendingBox = {player: undefined, delta: new Map()};
      pendingStandardProject = undefined;
    }
    const actorColor = stringOf(message, 0) as Color;
    const who = colorIndex.get(actorColor);
    if (who !== undefined && message.viewer === undefined) {
      active = actorColor;
    }
    const viewer = message.viewer !== undefined ? colorIndex.get(message.viewer) : undefined;

    if (text === 'Final greenery placement') {
      finalPhase = true;
    }
    if (text === 'Generation ${0}' || text === 'Final greenery placement') {
      if (text === 'Generation ${0}' || message.type === LogMessageType.NEW_GENERATION) {
        generation = numberOf(message, 0) || generation;
      }
      passed = [];
      players.forEach((player) => player.actionsThisGeneration = []);
      if (text === 'Final greenery placement' || generation > 1) {
        // Production phase (also after the last generation, before the final greeneries):
        // energy becomes heat, then all productions and TR as M€
        for (const player of players) {
          player.resources[5] += player.resources[4];
          player.resources[4] = 0;
          player.resources[0] += player.terraformRating;
          player.production.forEach((value, index) => player.resources[index] += value);
        }
      }
    } else if (text === '${0} played ${1}' && who !== undefined) {
      const player = players[who];
      const name = stringOf(message, 1) as CardName;
      const card = getCard(name);
      player.played.push(name);
      // Printed production at once; if the log then writes the same resource itself, the log counts
      pendingBox = {player: who, delta: productionBox(name)};
      pendingBox.delta.forEach((value, index) => player.production[index] += value);
      const silent = silentTiles.get(name);
      if (silent !== undefined) {
        tiles.set(silent.space, {space: silent.space, tileType: silent.tileType, color: actorColor});
      }
      if (card?.type === CardType.CORPORATION) {
        player.resources[0] += card.startingMegaCredits ?? 0;
      } else if (card?.type === CardType.AUTOMATED || card?.type === CardType.ACTIVE || card?.type === CardType.EVENT) {
        if (!removeOnce(player.hand, name) && player.unknownHand > 0) {
          player.unknownHand--;
        }
        let {cost} = cardCost(player, name);
        const {tags} = cardCost(player, name);
        if (player.nextCardDiscount > 0) {
          cost = Math.max(0, cost - player.nextCardDiscount);
          player.nextCardDiscount = 0;
        }
        pay(player, cost, tags);
        if (name === CardName.INDENTURED_WORKERS) {
          player.nextCardDiscount = INDENTURED_WORKERS_DISCOUNT;
        }
      }
      const discounts = card?.cardDiscount === undefined ? [] : Array.isArray(card.cardDiscount) ? card.cardDiscount : [card.cardDiscount];
      discounts.forEach((discount) => player.discounts.push({tag: discount.tag, amount: discount.amount ?? 0}));
      if (name === CardName.ADVANCED_ALLOYS) {
        player.steelValue++;
        player.titaniumValue++;
      }
      const printed = globalItems(name).play;
      raise('temperature', printed.temperature, who);
      raise('oxygen', printed.oxygen, who);
      player.terraformRating += printed.tr;
      pendingTr = {player: who, amount: printed.tr};
      costsOnPlay(name).forEach((value, index) => player.resources[index] += value);
    } else if (text === '${0} used ${1} action' && who !== undefined) {
      const name = stringOf(message, 1) as CardName;
      players[who].actionsThisGeneration.push(name);
      let printed = globalItems(name).action;
      if (getCard(name)?.resourceType !== undefined && !removesFromCard(line, name)) {
        printed = {temperature: 0, oxygen: 0, tr: 0};
      }
      const cost = actionCost(name);
      cost?.amounts.forEach((value, index) => {
        if (index === 0 && cost.titaniumAllowed) {
          pay(players[who], value, ['space']);
        } else {
          players[who].resources[index] -= value;
        }
      });
      raise('temperature', printed.temperature, who);
      raise('oxygen', printed.oxygen, who);
      players[who].terraformRating += printed.tr;
    } else if (text === '${0} used ${1} standard project' && who !== undefined) {
      const name = stringOf(message, 1).split(':')[0];
      players[who].resources[0] -= STANDARD_PROJECT_COST[name] ?? 0;
      // Power plant and city raise production; older logs don't write it, newer ones right after
      const index: ResourceIndex | undefined = name === 'Power Plant' ? 4 : name === 'City' ? 0 : undefined;
      if (index !== undefined) {
        players[who].production[index]++;
        pendingStandardProject = {player: who, index};
      }
      if (name === 'Asteroid') {
        raise('temperature', 1, who);
      }
    } else if (text === '${0} used ${1} standard action' && who !== undefined) {
      const name = stringOf(message, 1);
      if (name === 'Convert Plants') {
        players[who].resources[3] -= plantsForGreenery(players[who]);
      } else if (name === 'Convert Heat') {
        players[who].resources[5] -= 8;
        raise('temperature', 1, who);
      }
    } else if (text === '${0} passed' && who !== undefined) {
      passed.push(actorColor);
    } else if (text === '${0} sold ${1} patents' && who !== undefined) {
      const count = numberOf(message, 1);
      players[who].resources[0] += count;
      const sold = sales.get(line) ?? [];
      sold.forEach((card) => removeOnce(players[who].hand, card));
      // Which cards were sold the log doesn't say; what is not assigned was an unnamed starting card
      players[who].unknownHand -= Math.min(players[who].unknownHand, count - sold.length);
      trace.sells.push({line, player: who, count});
    } else if ((text === '${0} gained ${1} ${2}' || text === '${0} gained ${1} ${2} because of ${3}') && who !== undefined) {
      const index = RESOURCE_WORDS[stringOf(message, 2)];
      if (index !== undefined) {
        players[who].resources[index] += numberOf(message, 1);
      }
    } else if (text === '${0} gained 2 ${1} from ${2}' && who !== undefined) {
      players[who].resources[RESOURCE_WORDS[stringOf(message, 1)] ?? 3] += 2;
    } else if (text === '${0} lost ${1} ${2} because of ${3}' && who !== undefined) {
      const index = RESOURCE_WORDS[stringOf(message, 2)];
      if (index !== undefined) {
        players[who].resources[index] -= numberOf(message, 1);
      }
    } else if (text === '${0} gained ${1} M€ from ${2} ocean(s)' && who !== undefined) {
      players[who].resources[0] += numberOf(message, 1);
    } else if (text.includes(' production') && (text.startsWith('${0} gained ${1} ${2} production') || text.startsWith('${0} lost ${1} ${2} production')) && who !== undefined) {
      const index = RESOURCE_WORDS[stringOf(message, 2)];
      if (index !== undefined) {
        const amount = numberOf(message, 1) * (text.includes(' lost ') ? -1 : 1);
        if (pendingStandardProject?.player === who && pendingStandardProject.index === index && amount === 1) {
          players[who].production[index]--; // the log writes the standard project's production itself
          pendingStandardProject = undefined;
        }
        // Same resource with the same sign as in the printed box is the box itself (the amount may vary,
        // e.g. "1 per 2 building tags"); another sign is an extra effect (e.g. Immigrant City)
        const boxValue = pendingBox.player === who ? pendingBox.delta.get(index) : undefined;
        if (boxValue !== undefined && (boxValue > 0) === (amount > 0)) {
          players[who].production[index] -= boxValue;
          pendingBox.delta.delete(index);
        }
        players[who].production[index] += amount;
      }
    } else if (text === '${3} stole ${1} ${2} production from ${0}' && who !== undefined) {
      // The thief is already in the log as "gained ... production", here only the victim
      const index = RESOURCE_WORDS[stringOf(message, 2)];
      if (index !== undefined) {
        players[who].production[index] -= numberOf(message, 1);
      }
    } else if (text === '${3} stole ${1} ${2} from ${0}' && who !== undefined) {
      const index = RESOURCE_WORDS[stringOf(message, 2)] ?? 0;
      const thief = colorIndex.get(stringOf(message, 3) as Color);
      players[who].resources[index] -= numberOf(message, 1);
      if (thief !== undefined) {
        players[thief].resources[index] += numberOf(message, 1);
      }
    } else if (text === '${0} gained ${1} TR' && who !== undefined) {
      if (pendingTr.player === who && pendingTr.amount !== 0) {
        players[who].terraformRating -= pendingTr.amount; // the printed TR is logged here already
      }
      players[who].terraformRating += numberOf(message, 1);
      pendingTr = {player: undefined, amount: 0};
    } else if (text === '${0} ${1} ${2} at ${3}' && who !== undefined) {
      const tile = stringOf(message, 2);
      const space = stringOf(message, 3) as SpaceId;
      pendingStandardProject = undefined; // newer logs write the production before placing
      if (tile === 'land claim') {
        // Only a marker: the tile comes later with its own line
      } else if (tile.startsWith('ocean')) {
        tiles.set(space, {space, tileType: TileType.OCEAN});
        parameters.oceans++;
        players[who].terraformRating++;
      } else if (tile.startsWith('greenery')) {
        tiles.set(space, {space, tileType: TileType.GREENERY, color: actorColor});
        raise('oxygen', 1, who);
        if (finalPhase) {
          // The final greeneries have no standard action line, only the placement
          players[who].resources[3] -= plantsForGreenery(players[who]);
        }
      } else {
        // Kind of tile from the end (e.g. "Noctis City" is a city, so is the Capital)
        const tileType = endTileTypes.get(space) ?? (tile.startsWith('city') ? TileType.CITY : undefined);
        if (tileType !== undefined) {
          tiles.set(space, {space, tileType, color: actorColor});
        }
      }
    } else if (text === '${0} ${1} ${2} card(s)' && stringOf(message, 1) === 'bought' && who !== undefined) {
      players[who].resources[0] -= RESEARCH_CARD_COST * numberOf(message, 2);
    } else if (text === '${0} kept ${1} project cards' && who !== undefined) {
      const count = numberOf(message, 1);
      players[who].resources[0] -= RESEARCH_CARD_COST * count;
      // Newer logs name the starting cards privately before, older ones not at all. Then: dealt cards the player
      // plays later or still holds at the end must have been kept; the rest stays "unknown"
      let missing = Math.max(0, count - (firstBuy.get(who) ?? 0));
      if (missing > 0) {
        const kept = source.players[who].dealtProjectCards.filter((card) => laterCards[who].has(card)).slice(0, missing);
        players[who].hand.push(...kept);
        kept.forEach((card) => trace.acquired.push({player: who, card, line}));
        missing -= kept.length;
      }
      players[who].unknownHand += missing;
      firstBuy.set(who, count);
    } else if (ACQUIRE_MESSAGES.has(text) && viewer !== undefined) {
      const cards = cardsOf(message.data[message.data.length - 1]?.value);
      if (text !== '${0} drew ${1}' && generation === 1) {
        if (firstBuy.has(viewer)) {
          players[viewer].unknownHand -= Math.min(players[viewer].unknownHand, cards.length);
        } else {
          firstBuy.set(viewer, cards.length);
        }
      }
      players[viewer].hand.push(...cards);
      cards.forEach((card) => trace.acquired.push({player: viewer, card, line}));
    } else if (text === '${0} discarded ${1}' && viewer !== undefined) {
      cardsOf(valueOf(message, 1)).forEach((card) => removeOnce(players[viewer].hand, card));
    } else if (text === '${0} added ${1} ${2} to ${3}' && who !== undefined) {
      const card = stringOf(message, 3) as CardName;
      players[who].cardResources[card] = (players[who].cardResources[card] ?? 0) + numberOf(message, 1);
    } else if (text === '${0} removed ${1} resource(s) from ${2}\'s ${3}') {
      const owner = colorIndex.get(stringOf(message, 2) as Color);
      const card = stringOf(message, 3) as CardName;
      if (owner !== undefined) {
        players[owner].cardResources[card] = Math.max(0, (players[owner].cardResources[card] ?? 0) - numberOf(message, 1));
      }
    } else if (text === '${0} claimed ${1} milestone' && who !== undefined) {
      players[who].resources[0] -= MILESTONE_COST;
      milestones.push({name: stringOf(message, 1), color: actorColor});
    } else if (text === '${0} funded ${1} award' && who !== undefined) {
      players[who].resources[0] -= AWARD_COSTS[Math.min(awards.length, 2)];
      awards.push({name: stringOf(message, 1), color: actorColor});
    }

    states.push({
      generation,
      temperature: parameters.temperature,
      oxygenLevel: parameters.oxygenLevel,
      oceans: parameters.oceans,
      tiles: [...tiles.values()],
      milestones: [...milestones],
      awards: [...awards],
      passed: [...passed],
      active,
      players: players.map(snapshot),
    });
  });
  return {states, players, trace};
}

// Values can't go below zero, and the end is known exactly: set it
function anchorToEnd(states: Array<ReplayState>, source: ReplaySourceModel): void {
  for (const state of states) {
    state.players.forEach((player) => player.resources = player.resources.map((value) => Math.max(0, value)));
  }
  const last = states[states.length - 1];
  last?.players.forEach((player, index) => {
    const end = source.players[index].endResources;
    player.resources = [end.megacredits, end.steel, end.titanium, end.plants, end.energy, end.heat];
  });
}

/**
 * One state per log line: states[i] is the game after line i. Two passes: the first shows which cards vanish from
 * the hands without being played, the second assigns them to the patents sold.
 */
export function reconstructReplay(source: ReplaySourceModel): Array<ReplayState> {
  const first = reconstructPass(source, new Map());
  const leftovers: Array<{player: number, card: CardName, line: number}> = [];
  first.players.forEach((player, index) => {
    const finalHand = new Set(source.players[index].endHand);
    for (const card of player.hand) {
      if (!finalHand.has(card)) {
        const acquired = first.trace.acquired.filter((entry) => entry.player === index && entry.card === card);
        leftovers.push({player: index, card, line: acquired[acquired.length - 1]?.line ?? 0});
      }
    }
  });
  const sales = new Map<number, Array<CardName>>();
  for (const sell of first.trace.sells) {
    // Oldest leftover cards first that were already in the hand before the sale
    const candidates = leftovers.filter((item) => item.player === sell.player && item.line < sell.line)
      .sort((a, b) => a.line - b.line).slice(0, sell.count);
    candidates.forEach((item) => leftovers.splice(leftovers.indexOf(item), 1));
    sales.set(sell.line, candidates.map((item) => item.card));
  }
  const {states} = reconstructPass(source, sales);
  anchorToEnd(states, source);
  return states;
}
