import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import MobileMarsScreen from '@/client/components/mobile/MobileMarsScreen.vue';
import {fakeGameModel, fakePublicPlayerModel} from '../testHelpers';

describe('MobileMarsScreen', () => {
  it('shows the banner and reports the milestone shortcut', async () => {
    const wrapper = shallowMount(MobileMarsScreen, {
      ...globalConfig,
      props: {
        game: fakeGameModel(),
        players: [fakePublicPlayerModel({color: 'red'}), fakePublicPlayerModel({color: 'blue'})],
        participantId: 's-spectator-id',
        tileView: 'show',
        acting: false,
        bannerTitle: 'Red is taking their turn',
      },
    });
    expect(wrapper.find('.mb-banner--waiting .mb-banner-title').text()).to.eq('Red is taking their turn');
    await wrapper.find('.mb-quick button').trigger('click');
    expect(wrapper.emitted('showMilestones')).to.have.length(1);
  });
});
