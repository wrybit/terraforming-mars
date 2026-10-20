// DevTools: one action on a game (common/devtools/devToolsAction.ts); each part writes its own log line
import {IGame} from '../IGame';
import {IPlayer} from '../IPlayer';
import {DevToolsAction} from '../../common/devtools/devToolsAction';
import {RouteError} from '../routes/RouteError';
import {applyGlobals} from './devToolsGlobals';
import {applyTerraform} from './devToolsTerraform';
import {applyResources} from './devToolsResources';
import {applyCard} from './devToolsCards';

function playerOf(game: IGame, color: string): IPlayer {
  const player = game.players.find((candidate) => candidate.color === color);
  if (player === undefined) {
    throw RouteError.badRequest('No player with this colour');
  }
  return player;
}

export function applyDevToolsAction(game: IGame, action: DevToolsAction): void {
  switch (action.type) {
  case 'globals':
    applyGlobals(game, action);
    break;
  case 'terraform':
    applyTerraform(game, action);
    break;
  case 'resources':
    applyResources(playerOf(game, action.color), action);
    break;
  case 'card':
    applyCard(playerOf(game, action.color), action);
    break;
  }
}
