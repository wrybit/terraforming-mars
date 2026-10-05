import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from './getLocalVue';
import RowResizeHandle from '@/client/components/RowResizeHandle.vue';
import {MARS_HEIGHT_ATTRIBUTE} from '@/client/utils/rightColumnFit';

describe('RowResizeHandle', () => {
  beforeEach(() => {
    localStorage.removeItem('player_home_mars_height');
    localStorage.removeItem('player_home_players_height');
  });

  it('renders a horizontal separator', () => {
    const wrapper = mount(RowResizeHandle, {...globalConfig, props: {kind: 'players'}});
    expect(wrapper.classes()).to.include('row-resize-handle');
    expect(wrapper.attributes('role')).to.eq('separator');
    expect(wrapper.attributes('aria-orientation')).to.eq('horizontal');
  });

  it('double click resets the stored Mars height', async () => {
    localStorage.setItem('player_home_mars_height', '400');
    const column = document.createElement('div');
    column.className = 'player-home-columns__board';
    column.setAttribute(MARS_HEIGHT_ATTRIBUTE, '400');
    const card = document.createElement('div');
    column.appendChild(card);
    document.body.appendChild(column);

    const wrapper = mount(RowResizeHandle, {...globalConfig, props: {kind: 'mars'}, attachTo: document.body});
    // The handle sits directly below the card it resizes
    card.after(wrapper.element);
    await wrapper.trigger('dblclick');

    expect(column.hasAttribute(MARS_HEIGHT_ATTRIBUTE)).to.be.false;
    expect(localStorage.getItem('player_home_mars_height')).to.be.null;
    column.remove();
  });
});
