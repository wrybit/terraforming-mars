import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from './getLocalVue';
import GameBoardView from '@/client/components/GameBoardView.vue';
import {fakeGameModel} from './testHelpers';
import {placementZoom, releasePlacementZoom, requestPlacementZoom} from '@/client/components/board/placementZoom';

describe('GameBoardView', () => {
  it('mounts without errors', () => {
    const wrapper = shallowMount(GameBoardView, {
      ...globalConfig,
      props: {
        game: fakeGameModel(),
        tileView: 'show',
        players: [],
      },
    });
    expect(wrapper.exists()).to.be.true;
  });

  it('opens the zoom modal on board click unless a space selection is running', async () => {
    const wrapper = shallowMount(GameBoardView, {
      ...globalConfig,
      props: {
        game: fakeGameModel(),
        tileView: 'show',
        players: [],
      },
    });
    const board = wrapper.findComponent({name: 'Board'});

    // Space selection is running, even if no space is currently highlighted (after tapping a space)
    const selectSpace = document.createElement('div');
    selectSpace.className = 'select_space_cont';
    document.body.appendChild(selectSpace);
    await board.trigger('click');
    expect((wrapper.vm as any).boardZoomOpen).to.be.false;

    selectSpace.remove();
    await board.trigger('click');
    expect((wrapper.vm as any).boardZoomOpen).to.be.true;
  });

  it('follows placement zoom requests and releases them when closed', async () => {
    releasePlacementZoom();
    const wrapper = shallowMount(GameBoardView, {
      ...globalConfig,
      props: {
        game: fakeGameModel(),
        tileView: 'show',
        players: [],
      },
    });
    const vm = wrapper.vm as any;

    requestPlacementZoom();
    await wrapper.vm.$nextTick();
    expect(vm.boardZoomOpen).to.be.true;

    // Closed by the player: space selection continues on the small board
    vm.closeBoardZoom();
    expect(vm.boardZoomOpen).to.be.false;
    expect(placementZoom.requested).to.be.false;

    // Confirmed placement: board small again
    requestPlacementZoom();
    await wrapper.vm.$nextTick();
    releasePlacementZoom();
    await wrapper.vm.$nextTick();
    expect(vm.boardZoomOpen).to.be.false;
  });
});
