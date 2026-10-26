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
