import {ViewModel} from '@/common/models/PlayerModel';
import {playersToWaitFor, waitsInParallel} from '@/client/utils/playersToWaitFor';

// Banner text while others act (mobile, player and spectator), same wording as the status tab
// (WaitingForPlayersTab.vue): in turn order "X is taking their turn", in parallel phases whom we still wait for
export function waitingStatusText(view: ViewModel, translate: (text: string) => string): string {
  const names = playersToWaitFor(view).map((player) => player.name);
  if (names.length === 0) {
    return translate('Waiting for other players');
  }
  if (waitsInParallel(view)) {
    return translate('Waiting for other players') + ': ' + names.join(', ');
  }
  return names.join(', ') + ' ' + translate(names.length === 1 ? 'is taking their turn' : 'are taking their turn');
}
