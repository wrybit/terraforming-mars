import {CardName} from '@/common/cards/CardName';
import {getCard} from '@/client/cards/ClientCardManifest';

// What a replay reads off a printed card when the log doesn't say it (reconstructReplay.ts): the production box,
// raised global parameters, the cost of an action and costs paid on playing. All taken from the card's render
// data, the same picture the players see.

// Index of a resource in the replay's arrays: M€, steel, titanium, plants, energy, heat
export type ResourceIndex = 0 | 1 | 2 | 3 | 4 | 5;
export const RESOURCE_COUNT = 6;
const RENDER_RESOURCE: Record<string, ResourceIndex> = {megacredits: 0, steel: 1, titanium: 2, plants: 3, energy: 4, heat: 5};

type RenderNode = Record<string, unknown>;
const isNode = (value: unknown): value is RenderNode => typeof value === 'object' && value !== null && !Array.isArray(value);
const rowsOf = (node: RenderNode): Array<Array<unknown>> => Array.isArray(node.rows) ? node.rows as Array<Array<unknown>> : [];
const renderRoot = (name: CardName): RenderNode | undefined => {
  const data = getCard(name)?.metadata.renderData;
  return isNode(data) ? data : undefined;
};
const amountOf = (node: RenderNode): number => typeof node.amount === 'number' ? node.amount : 1;
const resourceIndexOf = (node: RenderNode): ResourceIndex | undefined =>
  node.is === 'item' && typeof node.type === 'string' ? RENDER_RESOURCE[node.type] : undefined;

function walk(node: unknown, visit: (node: RenderNode, inEffect: boolean) => boolean, inEffect = false): void {
  if (Array.isArray(node)) {
    node.forEach((child) => walk(child, visit, inEffect));
  } else if (isNode(node)) {
    if (visit(node, inEffect)) {
      const effect = inEffect || node.is === 'effect' || node.is === 'action';
      Object.values(node).forEach((child) => walk(child, visit, effect));
    }
  }
}

/** Own production change printed in the production box (without effects, without "any player", without choices). */
export function productionBox(name: CardName): Map<ResourceIndex, number> {
  const delta = new Map<ResourceIndex, number>();
  for (const row of rowsOf(renderRoot(name) ?? {})) {
    for (const element of row) {
      if (!isNode(element) || element.is !== 'production-box') {
        continue;
      }
      const boxRows = rowsOf(element);
      // A choice (steel OR titanium): the log names the chosen resource
      if (boxRows.some((boxRow) => boxRow.some((item) => isNode(item) && item.type === 'OR'))) {
        continue;
      }
      for (const boxRow of boxRows) {
        let sign = 1;
        for (const item of boxRow) {
          if (!isNode(item)) {
            continue;
          }
          if (item.is === 'symbol' && (item.type === '-' || item.type === '+')) {
            sign = item.type === '-' ? -1 : 1;
            continue;
          }
          const index = resourceIndexOf(item);
          if (index !== undefined && item.anyPlayer !== true) {
            const amount = amountOf(item);
            delta.set(index, (delta.get(index) ?? 0) + (amount < 0 ? amount : sign * amount));
          }
        }
      }
    }
  }
  return delta;
}

export type GlobalItems = {temperature: number, oxygen: number, tr: number};

/** Temperature, oxygen and TR printed on the card, separately for playing it and for its action. */
export function globalItems(name: CardName): {play: GlobalItems, action: GlobalItems} {
  const play = {temperature: 0, oxygen: 0, tr: 0};
  const action = {temperature: 0, oxygen: 0, tr: 0};
  const actionCard = getCard(name)?.hasAction === true;
  walk(renderRoot(name), (node, inEffect) => {
    if (node.is === 'item' && (node.type === 'temperature' || node.type === 'oxygen' || node.type === 'tr') && node.anyPlayer !== true) {
      // Effects of a card without action ("when someone ...") are not counted: the log shows their consequences
      if (!inEffect || actionCard) {
        const target = actionCard ? action : play;
        target[node.type] += amountOf(node);
      }
    }
    return true;
  });
  return {play, action};
}

// Left side of every action (cost -> gain) of a card, corporation actions included
function actionBlocks(name: CardName): Array<Array<unknown>> {
  const blocks: Array<Array<unknown>> = [];
  walk(renderRoot(name), (node) => {
    const rows = rowsOf(node);
    if (node.is === 'effect' && rows.length >= 3 && rows[1].some((item) => isNode(item) && item.type === '->')) {
      blocks.push(rows[0]);
      return false;
    }
    return true;
  });
  return blocks;
}

export type ActionCost = {amounts: Map<ResourceIndex, number>, titaniumAllowed: boolean};

/** Cost of a blue card's action. Undefined with several actions or a choice: the log is not clear then. */
export function actionCost(name: CardName): ActionCost | undefined {
  const blocks = actionBlocks(name);
  if (blocks.length !== 1) {
    return undefined;
  }
  const amounts = new Map<ResourceIndex, number>();
  let titaniumAllowed = false;
  for (const item of blocks[0]) {
    if (!isNode(item)) {
      continue;
    }
    if (item.type === 'OR') {
      return undefined;
    }
    const index = resourceIndexOf(item);
    if (index === undefined) {
      continue;
    }
    if (item.isSuperscript === true) {
      titaniumAllowed ||= item.type === 'titanium';
    } else {
      amounts.set(index, (amounts.get(index) ?? 0) + amountOf(item));
    }
  }
  return {amounts, titaniumAllowed};
}

// Printed minus that is a discount, not a payment
const DISCOUNT_NOT_COST = new Set<CardName>([CardName.INDENTURED_WORKERS]);

/** Own resources paid on playing (e.g. a prelude "pay 5 M€"); gains are written by the log. */
export function costsOnPlay(name: CardName): Map<ResourceIndex, number> {
  const costs = new Map<ResourceIndex, number>();
  if (DISCOUNT_NOT_COST.has(name)) {
    return costs;
  }
  for (const row of rowsOf(renderRoot(name) ?? {})) {
    for (const item of row) {
      if (!isNode(item)) {
        continue;
      }
      const index = resourceIndexOf(item);
      if (index !== undefined && amountOf(item) < 0 && item.anyPlayer !== true) {
        costs.set(index, (costs.get(index) ?? 0) + amountOf(item));
      }
    }
  }
  return costs;
}
