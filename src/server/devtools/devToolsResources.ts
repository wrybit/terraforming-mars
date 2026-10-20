// DevTools: resources and production of one player set to absolute values, in the log
import {IPlayer} from '../IPlayer';
import {DevToolsResourcesAction, DEVTOOLS_UNIT_KEYS} from '../../common/devtools/devToolsAction';
import {PRODUCTION_MINIMUMS} from '../../common/constants';

export function applyResources(player: IPlayer, action: DevToolsResourcesAction): void {
  for (const key of DEVTOOLS_UNIT_KEYS) {
    const stock = action.stock[key];
    if (stock !== undefined) {
      player.stock[key] = Math.max(0, Math.round(stock));
    }
    const production = action.production[key];
    if (production !== undefined) {
      // Below the minimum of the game (−5 M€, 0 otherwise) the production would break the rules of other cards
      player.production[key] = Math.max(PRODUCTION_MINIMUMS[key], Math.round(production));
    }
  }
  player.game.log('🛠 DevTools: resources and production of ${0} set', (b) => b.player(player));
}
