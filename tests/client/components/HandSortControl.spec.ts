import {mount} from '@vue/test-utils';
import {globalConfig} from './getLocalVue';
import {expect} from 'chai';
import HandSortControl from '@/client/components/HandSortControl.vue';

describe('HandSortControl', () => {
  function selectedLabel(wrapper: ReturnType<typeof mount>): string {
    return wrapper.find('.create-game-segmented--selected').text();
  }

  it('shows manual when no sort is chosen', () => {
    const wrapper = mount(HandSortControl, {...globalConfig, props: {sortOrder: undefined}});
    expect(selectedLabel(wrapper)).eq('Manual');
  });

  it('shows the chosen sort', () => {
    const wrapper = mount(HandSortControl, {...globalConfig, props: {sortOrder: {key: 'cost', reversed: false}}});
    expect(selectedLabel(wrapper)).eq('Cost');
    expect(wrapper.find('.hand-sort-control--reversed').exists()).is.false;
  });

  it('chooses a sort and flips it on a second tap', async () => {
    const wrapper = mount(HandSortControl, {...globalConfig, props: {sortOrder: undefined}});
    await wrapper.findAll('button')[1].trigger('click');
    expect(wrapper.emitted('update:sortOrder')![0]).to.deep.eq([{key: 'cost', reversed: false}]);

    await wrapper.setProps({sortOrder: {key: 'cost', reversed: false}});
    await wrapper.findAll('button')[1].trigger('click');
    expect(wrapper.emitted('update:sortOrder')![1]).to.deep.eq([{key: 'cost', reversed: true}]);
  });

  it('manual clears the sort, but only when one is set', async () => {
    const wrapper = mount(HandSortControl, {...globalConfig, props: {sortOrder: undefined}});
    await wrapper.findAll('button')[0].trigger('click');
    expect(wrapper.emitted('update:sortOrder')).is.undefined;

    await wrapper.setProps({sortOrder: {key: 'vp', reversed: false}});
    await wrapper.findAll('button')[0].trigger('click');
    expect(wrapper.emitted('update:sortOrder')![0]).to.deep.eq([undefined]);
  });
});
