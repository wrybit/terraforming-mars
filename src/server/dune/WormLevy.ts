import {IPlayer} from '../IPlayer';
import {LEVY_TITLE} from '../../common/dune/duneActionTitles';
import {PlayerId} from '../../common/Types';
import {Resource} from '../../common/Resource';
import {OrOptions} from '../inputs/OrOptions';
import {SelectOption} from '../inputs/SelectOption';
import {PlayerInput} from '../PlayerInput';
import {message} from '../logs/MessageBuilder';
import {BAZAAR_GOOD_VALUE} from '../../common/dune/bazaarWares';
import {RESOURCE_LABEL} from './resourceLabels';
import {WORM_LEVY_UNITS} from '../../common/dune/wormEffects';

// Levies of Shai-Hulud (module C): a trampled greenery costs 3 plants, a damaged special tile 3 M€.
// Whoever cannot pay the 3 units gives resources worth 4 instead (value table of module A) and chooses which.

export const LEVY_UNITS = WORM_LEVY_UNITS;
export const LEVY_FALLBACK_WORTH = 4;

export {LEVY_TITLE};

/** A levy the player still has to pay with other resources, worth `owed` */
export type PendingLevy = {
  player: PlayerId,
  owed: number,
};

/** Resources a levy can be paid with, and what one unit is worth */
export const LEVY_RESOURCE_WORTH: ReadonlyArray<[Resource, number]> = [
  [Resource.MEGACREDITS, 1],
  [Resource.STEEL, BAZAAR_GOOD_VALUE.steel],
  [Resource.TITANIUM, BAZAAR_GOOD_VALUE.titanium],
  [Resource.PLANTS, BAZAAR_GOOD_VALUE.plants],
  [Resource.ENERGY, BAZAAR_GOOD_VALUE.energy],
  [Resource.HEAT, BAZAAR_GOOD_VALUE.heat],
];

/**
 * Takes the 3 units when the player has them. Otherwise returns what the player still owes (worth 4) –
 * undefined when nothing is owed or the player has nothing to pay with.
 */
export function takeLevy(player: IPlayer, resource: Resource): PendingLevy | undefined {
  if (player.stock.get(resource) >= LEVY_UNITS) {
    player.stock.deduct(resource, LEVY_UNITS, {log: true});
    return undefined;
  }
  return canPay(player) ? {player: player.id, owed: LEVY_FALLBACK_WORTH} : undefined;
}

function canPay(player: IPlayer): boolean {
  return LEVY_RESOURCE_WORTH.some(([resource]) => player.stock.get(resource) > 0);
}

/** The player picks one resource at a time until the levy is paid or nothing is left; `levy.owed` shrinks as they pay */
export function levyInput(player: IPlayer, levy: PendingLevy): PlayerInput {
  const options = LEVY_RESOURCE_WORTH
    .filter(([resource]) => player.stock.get(resource) > 0)
    .map(([resource, worth]) => {
      const units = Math.min(player.stock.get(resource), Math.ceil(levy.owed / worth));
      return new SelectOption(message('${0} ${1}', (b) => b.number(units).string(RESOURCE_LABEL[resource])), 'Pay')
        .andThen(() => {
          player.stock.deduct(resource, units, {log: true});
          levy.owed -= units * worth;
          return levy.owed > 0 && canPay(player) ? levyInput(player, levy) : undefined;
        });
    });
  return new OrOptions(...options).setTitle(message(LEVY_TITLE, (b) => b.number(levy.owed)));
}
