import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import PlayerIdentity from '@/client/components/overview/PlayerIdentity.vue';
import {CardName} from '@/common/cards/CardName';
import {Color} from '@/common/Color';
import {fakeGameModel, fakePublicPlayerModel, fakeViewModel} from '../testHelpers';

function mountIdentity(actionLabel: 'active' | 'passed', highlighted: boolean) {
  const player = fakePublicPlayerModel({color: 'red' as Color, name: 'Daniel', tableau: [{name: CardName.SATURN_SYSTEMS}]});
  const playerView = fakeViewModel({players: [player], game: fakeGameModel()});
  return mount(PlayerIdentity, {...globalConfig, props: {player, playerView, actionLabel, highlighted}});
}

describe('PlayerIdentity', () => {
  it('shows name and corporation', () => {
    const wrapper = mountIdentity('passed', false);
    expect(wrapper.find('.players-table-name').text()).to.contain('Daniel');
    expect(wrapper.find('.players-table-corporation').text()).to.eq('Saturn Systems');
    expect(wrapper.findComponent({name: 'PlayerStatus'}).exists()).to.be.true;
  });

  it('marks the own player and the acting player', () => {
    const wrapper = mountIdentity('active', true);
    expect(wrapper.classes()).to.include('players-table-identity--me');
    expect(wrapper.classes()).to.include('players-table-identity--acting');
    expect(mountIdentity('passed', false).classes()).to.not.include('players-table-identity--acting');
  });
});
