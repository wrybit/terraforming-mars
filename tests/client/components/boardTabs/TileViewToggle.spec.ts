import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import TileViewToggle from '@/client/components/boardTabs/TileViewToggle.vue';

describe('TileViewToggle', () => {
  it('marks the current view', () => {
    const wrapper = mount(TileViewToggle, {...globalConfig, props: {tileView: 'hide'}});
    const options = wrapper.findAll('.tile-view-toggle__option');
    expect(options[1].classes()).includes('tile-view-toggle__option--on');
  });

  it('steps through the views until the chosen one is reached', async () => {
    const wrapper = mount(TileViewToggle, {...globalConfig, props: {tileView: 'show'}});
    // show → hide → coords: two steps
    await wrapper.findAll('.tile-view-toggle__option')[2].trigger('click');
    expect(wrapper.emitted('toggleTileView')).has.length(2);
  });
});
