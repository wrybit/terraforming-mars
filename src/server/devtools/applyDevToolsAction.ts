// DevTools: one action on a game (common/devtools/devToolsAction.ts); each part writes its own log line
import {IGame} from '../IGame';
import {IPlayer} from '../IPlayer';
import {DevToolsAction} from '../../common/devtools/devToolsAction';
import {RouteError} from '../routes/RouteError';
import {applyGlobals} from './devToolsGlobals';
import {applyOceans, applyTerraform} from './devToolsTerraform';
import {switchSetup} from './devToolsSetup';
import {applyPlayer} from './devToolsPlayer';
import {applyTrigger} from './devToolsTriggers';
import {applyResources} from './devToolsResources';
import {applyCard} from './devToolsCards';

function playerOf(game: IGame, color: string): IPlayer {
  const player = game.players.find((candidate) => candidate.color === color);
  if (player === undefined) {
    throw RouteError.badRequest('No player with this colour');
  }
  return player;
}

/** Returns the game to save: the same one, or for a new board a game built anew from the save */
export function applyDevToolsAction(game: IGame, action: DevToolsAction): IGame {
  switch (action.type) {
  case 'setup':
    return switchSetup(game, action);
  case 'globals':
    applyGlobals(game, action);
    break;
  case 'terraform':
    applyTerraform(game, action);
    break;
  case 'oceans':
    applyOceans(game, action);
    break;
  case 'resources':
    applyResources(playerOf(game, action.color), action);
    break;
  case 'card':
    applyCard(playerOf(game, action.color), action);
    break;
  case 'player':
    applyPlayer(playerOf(game, action.color), action);
    break;
  case 'trigger':
    applyTrigger(game, playerOf(game, action.color), action);
    break;
  }
  return game;
}
