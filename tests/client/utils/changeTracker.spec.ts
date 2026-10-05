import {expect} from 'chai';
import {ViewModel} from '@/common/models/PlayerModel';
import {Resource} from '@/common/Resource';
import {flashAreaOf, flashKeys} from '@/client/utils/changeFlashKeys';
import {changeToneOf, ingestView, isChangePending, markChangeAnnounced, markChangeSeen, resetChangeTracker, unannouncedChanges} from '@/client/utils/changeTracker';
import {fakeGameModel, fakePublicPlayerModel, fakeViewModel} from '../components/testHelpers';

function view(megacredits: number, temperature = -30, generation = 1): ViewModel {
  const player = fakePublicPlayerModel({color: 'red', megacredits});
  return fakeViewModel({players: [player], thisPlayer: player, game: fakeGameModel({temperature, generation})});
}

const megacreditsKey = flashKeys.playerStock('red', Resource.MEGACREDITS);
const temperatureKey = flashKeys.globalParameter('temperature');

describe('changeTracker', () => {
  beforeEach(resetChangeTracker);

  it('keys start with their area', () => {
    expect(flashAreaOf(megacreditsKey)).to.eq('players');
    expect(flashAreaOf(temperatureKey)).to.eq('mars');
    expect(flashAreaOf(flashKeys.moonRate('mining'))).to.eq('moon');
    expect(flashAreaOf(flashKeys.milestone('Builder'))).to.eq('milestonesAwards');
  });

  it('nothing blinks after the first view (reload)', () => {
    ingestView(view(10), 'remote');
    expect(isChangePending(megacreditsKey)).is.false;
  });

  it('remembers changes made by another player', () => {
    ingestView(view(10), 'remote');
    ingestView(view(8, -28), 'remote');
    expect(isChangePending(megacreditsKey)).is.true;
    expect(isChangePending(temperatureKey)).is.true;
    expect(isChangePending(flashKeys.playerStock('red', Resource.STEEL))).is.false;
  });

  it('own moves do not blink but become the new baseline', () => {
    ingestView(view(10), 'remote');
    ingestView(view(8), 'own');
    expect(isChangePending(megacreditsKey)).is.false;
    ingestView(view(8), 'remote');
    expect(isChangePending(megacreditsKey)).is.false;
  });

  it('nothing blinks on a generation change, unseen changes are dropped', () => {
    ingestView(view(10), 'remote');
    ingestView(view(8), 'remote');
    ingestView(view(30, -30, 2), 'remote');
    expect(isChangePending(megacreditsKey)).is.false;
  });

  it('each tab announces a change once', () => {
    ingestView(view(10), 'remote');
    ingestView(view(8), 'remote');
    expect(unannouncedChanges('nav', ['players'])).to.deep.eq([megacreditsKey]);
    expect(unannouncedChanges('nav', ['mars'])).to.deep.eq([]);
    markChangeAnnounced(megacreditsKey, 'nav');
    expect(unannouncedChanges('nav', ['players'])).to.deep.eq([]);
    expect(unannouncedChanges('segment', ['players'])).to.deep.eq([megacreditsKey]);
    markChangeSeen(megacreditsKey);
    expect(isChangePending(megacreditsKey)).is.false;
  });

  it('tells losses from gains', () => {
    ingestView(view(10, -30), 'remote');
    ingestView(view(8, -28), 'remote');
    expect(changeToneOf(megacreditsKey)).to.eq('loss');
    expect(changeToneOf(temperatureKey)).to.eq('gain');
  });

  it('several unseen changes: tone compares with what the viewer last saw', () => {
    ingestView(view(10), 'remote');
    ingestView(view(8), 'remote');
    ingestView(view(12), 'remote');
    expect(changeToneOf(megacreditsKey)).to.eq('gain');
  });
});
