import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import BoardZoomModal from '@/client/components/board/BoardZoomModal.vue';

describe('BoardZoomModal', () => {
  function mountModal(open: boolean) {
    return mount(BoardZoomModal, {
      ...globalConfig,
      props: {open},
      slots: {default: '<div class="board-cont"><div class="hide-tile-button">tiles</div></div>'},
      attachTo: document.body,
    });
  }

  it('renders nothing when closed', () => {
    mountModal(false);
    expect(document.querySelector('.board-zoom-backdrop')).to.be.null;
  });

  it('closes on backdrop click, but not on the tile toggle', async () => {
    const wrapper = mountModal(true);
    (document.querySelector('.hide-tile-button') as HTMLElement).click();
    expect(wrapper.emitted('close')).to.be.undefined;
    (document.querySelector('.board-zoom-backdrop') as HTMLElement).click();
    expect(wrapper.emitted('close')).to.have.length(1);
  });

  it('closes on Escape', () => {
    const wrapper = mountModal(true);
    window.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape'}));
    expect(wrapper.emitted('close')).to.have.length(1);
  });
});
