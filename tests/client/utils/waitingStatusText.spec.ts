import {expect} from 'chai';
import {waitingStatusText} from '@/client/utils/waitingStatusText';
import {PlayerViewModel, PublicPlayerModel} from '@/common/models/PlayerModel';
import {Phase} from '@/common/Phase';
import {asComplete} from '../components/utils/models';

function view(phase: Phase): PlayerViewModel {
  const me = asComplete<PublicPlayerModel>({color: 'blue', name: 'Jens', isActive: false, needsToDraft: false});
  const daniel = asComplete<PublicPlayerModel>({color: 'red', name: 'Daniel', isActive: true, needsToDraft: true});
  return asComplete<PlayerViewModel>({game: {phase} as PlayerViewModel['game'], thisPlayer: me, players: [me, daniel]});
}

describe('waitingStatusText', () => {
  const translate = (text: string) => text;

  it('names whose turn it is in the action phase', () => {
    expect(waitingStatusText(view(Phase.ACTION), translate)).eq('Daniel is taking their turn');
  });

  it('says whom we are waiting for in the draft', () => {
    expect(waitingStatusText(view(Phase.DRAFTING), translate)).eq('Waiting for other players: Daniel');
  });
});
