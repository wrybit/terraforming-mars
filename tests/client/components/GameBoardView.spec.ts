import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from './getLocalVue';
import GameBoardView from '@/client/components/GameBoardView.vue';
import {fakeGameModel} from './testHelpers';

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

  it('opens the zoom modal on board click unless a space must be placed', async () => {
    const wrapper = shallowMount(GameBoardView, {
      ...globalConfig,
      props: {
        game: fakeGameModel(),
        tileView: 'show',
        players: [],
      },
    });
    const board = wrapper.findComponent({name: 'Board'});

    // Platzieren aktiv: wählbares Feld vorhanden
    const selectable = document.createElement('div');
    selectable.className = 'board-space--available';
    document.body.appendChild(selectable);
    await board.trigger('click');
    expect((wrapper.vm as any).boardZoomOpen).to.be.false;

    selectable.remove();
    await board.trigger('click');
    expect((wrapper.vm as any).boardZoomOpen).to.be.true;
  });
});
