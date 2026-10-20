// DevTools intervention mode: sends one change to the server (routes/ApiDevTools.ts). The server checks the admin
// login and writes the change into the game log; afterwards every open page loads the game anew.
import {paths} from '@/common/app/paths';
import {DevToolsAction, DevToolsRequest} from '@/common/devtools/devToolsAction';
import {PlayerId} from '@/common/Types';

export async function sendDevToolsAction(playerId: PlayerId, action: DevToolsAction): Promise<void> {
  const request: DevToolsRequest = {playerId, action};
  const response = await fetch(paths.API_DEVTOOLS, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`DevTools: ${response.status} ${text}`);
  }
}
