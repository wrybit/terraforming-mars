import {mount} from '@vue/test-utils';
import {globalConfig} from './getLocalVue';
import {expect} from 'chai';
import CardSortMenu from '@/client/components/cardfilter/CardSortMenu.vue';

describe('CardSortMenu', () => {
  it('reports manual and the chosen sorting with its direction', async () => {
    const wrapper = mount(CardSortMenu, {...globalConfig, props: {modelValue: {key: 'type', reversed: false}, compact: false, allowManual: true}});
    expect(wrapper.find('.card-sort__more').text()).eq('Type ↑');

    await wrapper.find('.card-sort__manual').trigger('click');
    expect(wrapper.emitted('update:modelValue')?.[0]).to.deep.eq([undefined]);

    await wrapper.find('.card-sort__more').trigger('click');
    await wrapper.findAll('.card-sort-menu__row')[3].findAll('button')[1].trigger('click');
    expect(wrapper.emitted('update:modelValue')?.[1]).to.deep.eq([{key: 'vp', reversed: true}]);
  });
});
