import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import MobilePlayersPanel from '@/client/components/mobile/MobilePlayersPanel.vue';
import {fakePublicPlayerModel, fakeViewModel} from '../testHelpers';

describe('MobilePlayersPanel', () => {
  it('switches segments via update:segment', async () => {
    const viewModel = fakeViewModel({players: [fakePublicPlayerModel({color: 'red'}), fakePublicPlayerModel({color: 'blue'})]});
    const wrapper = shallowMount(MobilePlayersPanel, {...globalConfig, props: {viewModel, segment: 'players'}});
    const segments = wrapper.findAll('.mb-segment');
    expect(segments).to.have.length(2);
    await segments[1].trigger('click');
    expect(wrapper.emitted('update:segment')).to.deep.eq([['ma']]);
  });
});
