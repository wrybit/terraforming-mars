import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import PlayersTableRow from '@/client/components/overview/PlayersTableRow.vue';
import {buildTagDetails} from '@/client/components/overview/playerTagDetails';
import {Tag} from '@/common/cards/Tag';
import {CardName} from '@/common/cards/CardName';
import {Color} from '@/common/Color';
import {emptyTags, fakeGameModel, fakePublicPlayerModel, fakeViewModel} from '../testHelpers';

function mountRow(options: {showOtherPlayersVP: boolean, setVisibilityState?: (key: string, value: boolean) => void}) {
  const me = fakePublicPlayerModel({color: 'blue' as Color});
  const other = fakePublicPlayerModel({
    color: 'red' as Color,
    name: 'Daniel',
    terraformRating: 24,
    cardsInHandNbr: 10,
    tags: {...emptyTags(), [Tag.BUILDING]: 8},
    tableau: [{name: CardName.SATURN_SYSTEMS}, {name: CardName.ACQUIRED_COMPANY}],
  });
  const playerView = fakeViewModel({
    players: [other, me],
    thisPlayer: me,
    game: fakeGameModel({gameOptions: {showOtherPlayersVP: options.showOtherPlayersVP}}),
  });
  return shallowMount(PlayersTableRow, {
    ...globalConfig,
    global: {
      ...globalConfig.global,
      mocks: {
        getVisibilityState: () => false,
        setVisibilityState: options.setVisibilityState ?? (() => {}),
      },
    },
    props: {
      player: other,
      playerView,
      actionLabel: 'passed',
      playerIndex: 0,
      visibility: {goods: true, tags: true, score: true},
      tagColumns: [[Tag.BUILDING]],
      tagDetails: buildTagDetails(other, playerView),
    },
  });
}

describe('PlayersTableRow', () => {
  it('shows score counters, tags and played cards', () => {
    const wrapper = mountRow({showOtherPlayersVP: false});
    expect(wrapper.find('[data-test="vp"]').text()).to.eq('?');
    expect(wrapper.find('[data-test="tr"]').text()).to.eq('24');
    expect(wrapper.find('[data-test="hand"]').text()).to.eq('10');
    expect(wrapper.find('[data-test="tag-building"]').text()).to.eq('8');
    expect(wrapper.find('[data-test="played-cards"]').text()).to.eq('2');
  });

  it('shows other players victory points when the game allows it', () => {
    const wrapper = mountRow({showOtherPlayersVP: true});
    expect(wrapper.find('[data-test="vp"]').text()).to.eq('20');
  });

  it('opens the played cards on click', async () => {
    const calls: Array<[string, boolean]> = [];
    const wrapper = mountRow({showOtherPlayersVP: false, setVisibilityState: (key, value) => calls.push([key, value])});
    await wrapper.trigger('click');
    expect(calls).to.deep.include(['pinned_player_0', true]);
  });
});
