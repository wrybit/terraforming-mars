import {mount, shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from './getLocalVue';
import SelectParty from '@/client/components/SelectParty.vue';
import {fakePlayerViewModel} from './testHelpers';

describe('SelectParty', () => {
  it('mounts without errors', () => {
    const wrapper = shallowMount(SelectParty, {
      ...globalConfig,
      props: {
        playerView: fakePlayerViewModel(),
        playerinput: {
          title: 'Select a party',
          buttonLabel: 'Save',
          type: 'party',
          parties: [],
        },
        onsave: () => {},
        showsave: true,
        showtitle: true,
      },
    });
    expect(wrapper.exists()).to.be.true;
  });

  it('shows parties as tiles with the source and forecasts the pick', async () => {
    const {fakeGameModel} = await import('./testHelpers');
    const {fakeTurmoil} = await import('./turmoil/turmoilFixtures');
    const {boardTabState, selectBoardTab} = await import('@/client/components/boardTabs/boardTabState');
    let saved: any;
    const wrapper = mount(SelectParty, {
      ...globalConfig,
      props: {
        playerView: fakePlayerViewModel({game: fakeGameModel({turmoil: fakeTurmoil()})}),
        playerinput: {title: 'Send a delegate in an area (from lobby)', buttonLabel: 'Send delegate', type: 'party', parties: ['Unity', 'Reds'] as any},
        onsave: (out: any) => saved = out,
        showsave: true,
        showtitle: true,
      },
    });
    expect(boardTabState.active).eq('turmoil');
    expect(wrapper.find('.select-party__source').text()).contains('Lobby');
    expect(wrapper.findAll('.select-party__card')).has.length(6);
    expect(wrapper.find('[data-test="party-Greens"]').classes()).includes('select-party__card--off');
    await wrapper.find('[data-test="party-Unity"] input').setValue(true);
    expect(wrapper.find('.select-party__preview').text()).contains('party leader');
    (wrapper.vm as any).saveData();
    expect(saved).deep.eq({type: 'party', partyName: 'Unity'});
    wrapper.unmount();
    selectBoardTab('mars');
  });
});
