// DevTools: global parameters set directly (common/devtools/devToolsAction.ts), each change in the log
import {IGame} from '../IGame';
import {DevToolsGlobalsAction} from '../../common/devtools/devToolsAction';
import {MIN_TEMPERATURE} from '../../common/constants';

// The Dune theme counts the water storage from 0 instead of −30 °C (client/theme/themeDisplay.ts temperatureText):
// the log line shows the number of the scale the players see
function shownTemperature(game: IGame): number {
  return game.gameOptions.theme === 'dune' ? game.getTemperature() - MIN_TEMPERATURE : game.getTemperature();
}

export function applyGlobals(game: IGame, action: DevToolsGlobalsAction): void {
  const before = {temperature: game.getTemperature(), oxygen: game.getOxygenLevel(), venus: game.getVenusScaleLevel()};
  game.setGlobalParametersForDevTools(action);
  if (game.getTemperature() !== before.temperature) {
    game.log('🛠 DevTools: temperature set to ${0}', (b) => b.number(shownTemperature(game)));
  }
  if (game.getOxygenLevel() !== before.oxygen) {
    game.log('🛠 DevTools: oxygen set to ${0}', (b) => b.number(game.getOxygenLevel()));
  }
  if (game.getVenusScaleLevel() !== before.venus) {
    game.log('🛠 DevTools: Venus set to ${0}', (b) => b.number(game.getVenusScaleLevel()));
  }
}
