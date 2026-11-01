import {ICard} from '../cards/ICard';
import {IGame} from '../IGame';

// Effects triggered by a global parameter step (Arctic Algae: "when anyone places an ocean tile, gain 2 plants")
// earn nothing once that parameter is at its maximum: no ocean can come any more. The valuation still counted
// such effects per generation, so a human-game AI paid for Arctic Algae with all 9 oceans placed. Read from the
// card's own effect icons, so every card with such a trigger is covered.

type Parameter = 'oceans' | 'temperature' | 'oxygen' | 'venus';
const PARAMETERS: ReadonlyArray<Parameter> = ['oceans', 'temperature', 'oxygen', 'venus'];
const triggerCache = new Map<string, ReadonlyArray<Parameter>>();

/** Global parameters named in the trigger (left part) of the card's effects. */
function triggerParameters(card: ICard): ReadonlyArray<Parameter> {
  const cached = triggerCache.get(card.name);
  if (cached !== undefined) {
    return cached;
  }
  const found = new Set<Parameter>();
  const visit = (node: unknown): void => {
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (typeof node !== 'object' || node === null) {
      return;
    }
    const entry = node as {is?: string, rows?: Array<Array<{type?: string}>>};
    if (entry.is === 'effect' && Array.isArray(entry.rows) && Array.isArray(entry.rows[0])) {
      for (const item of entry.rows[0]) {
        const type = (item as {type?: string})?.type;
        if (PARAMETERS.includes(type as Parameter)) {
          found.add(type as Parameter);
        }
      }
    }
    // Some cards draw their effect as a plain row "oceans * : …" instead of an effect box
    // (Neptunian Power Consultants): the parameters before the colon are the trigger too.
    if (Array.isArray(entry.rows)) {
      for (const row of entry.rows) {
        if (!Array.isArray(row)) {
          continue;
        }
        const colon = row.findIndex((item) => (item as {is?: string, type?: string})?.is === 'symbol' && (item as {type?: string}).type === ':');
        for (const item of row.slice(0, Math.max(0, colon))) {
          const type = (item as {type?: string})?.type;
          if (PARAMETERS.includes(type as Parameter)) {
            found.add(type as Parameter);
          }
        }
      }
    }
    Object.values(node).forEach(visit);
  };
  visit(card.metadata?.renderData);
  const result = [...found];
  triggerCache.set(card.name, result);
  return result;
}

function isMaxed(game: IGame, parameter: Parameter): boolean {
  switch (parameter) {
  case 'oceans':
    return !game.canAddOcean();
  case 'temperature':
    return game.getTemperature() >= game.max.temperature;
  case 'oxygen':
    return game.getOxygenLevel() >= game.max.oxygen;
  case 'venus':
    return game.getVenusScaleLevel() >= game.max.venus;
  }
}

/** True when every global parameter that triggers the card's effects is maxed (the effect earns nothing more). */
export function effectExhausted(card: ICard, game: IGame): boolean {
  const parameters = triggerParameters(card);
  return parameters.length > 0 && parameters.every((parameter) => isMaxed(game, parameter));
}

type ActionBehavior = {
  or?: {behaviors?: ReadonlyArray<ActionBehavior>},
  ocean?: unknown,
  global?: Partial<Record<'temperature' | 'oxygen' | 'venus', number>>,
  addResources?: unknown,
  spend?: unknown,
  title?: unknown,
};

/** Global parameters a behavior raises, or undefined when it does anything else as well. */
function onlyRaises(behavior: ActionBehavior): ReadonlyArray<Parameter> | undefined {
  const raised: Array<Parameter> = [];
  for (const [key, value] of Object.entries(behavior)) {
    if (key === 'spend' || key === 'title') {
      continue;
    }
    if (key === 'ocean') {
      raised.push('oceans');
    } else if (key === 'global' && typeof value === 'object' && value !== null) {
      raised.push(...Object.keys(value).filter((name) => PARAMETERS.includes(name as Parameter)) as Array<Parameter>);
    } else {
      return undefined;
    }
  }
  return raised;
}

/** True when the behavior only adds resources to this card (fuel for another action of the same card). */
function onlyFeeds(behavior: ActionBehavior): boolean {
  const keys = Object.keys(behavior).filter((key) => key !== 'spend' && key !== 'title');
  return keys.length === 1 && keys[0] === 'addResources';
}

/**
 * True when every use of the card's action only raises a maxed global parameter, or only stocks the card for
 * such a use (Icy Impactors with all oceans placed: an asteroid can no longer become an ocean). Cards that score
 * points for their resources keep their value – the resources still count.
 */
export function actionExhausted(card: ICard, game: IGame): boolean {
  const action = (card as {actionBehavior?: ActionBehavior}).actionBehavior;
  if (action === undefined) {
    return false;
  }
  const points = (card as {victoryPoints?: unknown}).victoryPoints;
  if (typeof points === 'object' && points !== null && 'resourcesHere' in points) {
    return false;
  }
  const behaviors = action.or?.behaviors ?? [action];
  let dead = 0;
  for (const behavior of behaviors) {
    const raised = onlyRaises(behavior);
    if (raised !== undefined && raised.length > 0 && raised.every((parameter) => isMaxed(game, parameter))) {
      dead++;
    } else if (!onlyFeeds(behavior)) {
      return false;
    }
  }
  return dead > 0;
}

/** True when the card's effect or action can no longer earn anything (see above). */
export function cardExhausted(card: ICard, game: IGame): boolean {
  return effectExhausted(card, game) || actionExhausted(card, game);
}
