import {flushPromises, mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import BoardZoomModal from '@/client/components/board/BoardZoomModal.vue';

describe('BoardZoomModal', () => {
  function mountModal(open: boolean) {
    return mount(BoardZoomModal, {
      ...globalConfig,
      props: {open},
      slots: {default: '<div class="board-cont"></div>', controls: '<button class="tile-toggle">tiles</button>'},
      attachTo: document.body,
    });
  }

  it('renders nothing when closed', async () => {
    mountModal(false);
    await flushPromises();
    expect(document.querySelector('.board-zoom-backdrop')).to.be.null;
  });

  it('closes on backdrop click, but not on the tile toggle below the board', async () => {
    const wrapper = mountModal(true);
    await flushPromises();
    expect(document.querySelector('.board-zoom-controls .tile-toggle')).not.to.be.null;
    (document.querySelector('.tile-toggle') as HTMLElement).click();
    expect(wrapper.emitted('close')).to.be.undefined;
    (document.querySelector('.board-zoom-backdrop') as HTMLElement).click();
    expect(wrapper.emitted('close')).to.have.length(1);
  });

  it('closes on Escape', async () => {
    const wrapper = mountModal(true);
    await flushPromises();
    window.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape'}));
    expect(wrapper.emitted('close')).to.have.length(1);
  });

  it('hides the column board while open and restores it after closing', async () => {
    const origin = document.createElement('div');
    document.body.appendChild(origin);
    const wrapper = mount(BoardZoomModal, {...globalConfig, props: {open: true, origin}, attachTo: document.body});
    await flushPromises();
    expect(origin.classList.contains('board-zoom-origin--hidden')).to.be.true;
    await wrapper.setProps({open: false});
    await flushPromises();
    expect(origin.classList.contains('board-zoom-origin--hidden')).to.be.false;
    expect(document.querySelector('.board-zoom-backdrop')).to.be.null;
    origin.remove();
  });
});
