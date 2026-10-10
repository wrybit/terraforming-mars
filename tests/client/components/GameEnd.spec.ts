import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from './getLocalVue';
import GameEnd from '@/client/components/GameEnd.vue';
import {fakePlayerViewModel} from './testHelpers';

describe('GameEnd', () => {
  it('mounts without errors', () => {
    const wrapper = shallowMount(GameEnd, {
      ...globalConfig,
      props: {
        participant: fakePlayerViewModel(),
      },
    });
    expect(wrapper.exists()).to.be.true;
  });

  it('opens the zoom modal on board click, not on the tile view button', async () => {
    const wrapper = shallowMount(GameEnd, {
      ...globalConfig,
      props: {
        participant: fakePlayerViewModel(),
      },
    });
    const board = wrapper.findComponent({name: 'Board'});

    const tileButton = document.createElement('div');
    tileButton.className = 'hide-tile-button';
    board.element.appendChild(tileButton);
    tileButton.click();
    expect((wrapper.vm as any).boardZoomOpen).to.be.false;

    await board.trigger('click');
    expect((wrapper.vm as any).boardZoomOpen).to.be.true;
    expect((wrapper.vm as any).zoomBoard).to.eq('mars');
  });
});
