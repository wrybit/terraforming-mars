// Contract between the DevTools panel (client/devtools) and api/devtools (server/routes/ApiDevTools.ts): what an admin
// may change in a running game. Every action is written to the game log, so nobody can use it unseen.
import {Color} from '../Color';
import {PlayerId} from '../Types';
import {CardName} from '../cards/CardName';
import {Units} from '../Units';

/** Global parameters set directly, without rewards or terraform rating */
export type DevToolsGlobalsAction = {
  type: 'globals',
  temperature?: number,
  oxygen?: number,
  venus?: number,
};

/**
 * Fills the planet: `share` from 0 to 1 of all ocean spaces get an ocean, the same share of the free land spaces
 * a greenery or city (two greeneries per city, owners in turn). Turning it back removes only tiles placed this way.
 */
export type DevToolsTerraformAction = {
  type: 'terraform',
  share: number,
};

/** Resources and production of one player, as absolute values */
export type DevToolsResourcesAction = {
  type: 'resources',
  color: Color,
  stock: Partial<Units>,
  production: Partial<Units>,
};

/** A project card into the hand of a player, or straight into play without its effect */
export type DevToolsCardAction = {
  type: 'card',
  color: Color,
  card: CardName,
  to: 'hand' | 'tableau',
};

export type DevToolsAction = DevToolsGlobalsAction | DevToolsTerraformAction | DevToolsResourcesAction | DevToolsCardAction;

/** The page sends its own player id: it names the game, and the log says through whose view the admin acted */
export type DevToolsRequest = {
  playerId: PlayerId,
  action: DevToolsAction,
};

export const DEVTOOLS_UNIT_KEYS = ['megacredits', 'steel', 'titanium', 'plants', 'energy', 'heat'] as const;

function isOptionalNumber(value: unknown): boolean {
  return value === undefined || (typeof value === 'number' && Number.isFinite(value));
}

function isUnits(value: unknown): value is Partial<Units> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  return Object.entries(value).every(([key, amount]) => (DEVTOOLS_UNIT_KEYS as ReadonlyArray<string>).includes(key) && isOptionalNumber(amount));
}

/** Shape check of an incoming action (the server checks values like colours and card names against the game) */
export function isDevToolsAction(value: unknown): value is DevToolsAction {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const action = value as Record<string, unknown>;
  switch (action.type) {
  case 'globals':
    return isOptionalNumber(action.temperature) && isOptionalNumber(action.oxygen) && isOptionalNumber(action.venus);
  case 'terraform':
    return typeof action.share === 'number' && action.share >= 0 && action.share <= 1;
  case 'resources':
    return typeof action.color === 'string' && isUnits(action.stock) && isUnits(action.production);
  case 'card':
    return typeof action.color === 'string' && typeof action.card === 'string' && (action.to === 'hand' || action.to === 'tableau');
  default:
    return false;
  }
}
