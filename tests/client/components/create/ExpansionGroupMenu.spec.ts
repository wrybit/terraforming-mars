import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import ExpansionGroupMenu from '@/client/components/create/ExpansionGroupMenu.vue';
import {EXPANSION_GROUPINGS} from '@/client/components/create/expansionGrouping';

describe('ExpansionGroupMenu', () => {
  it('names the current grouping on the button', () => {
    const wrapper = mount(ExpansionGroupMenu, {...globalConfig, props: {modelValue: 'corporation'}});
    expect(wrapper.find('.card-sort__more').text()).includes('Corporations');
  });

  it('lists every grouping and emits the chosen one', async () => {
    const wrapper = mount(ExpansionGroupMenu, {...globalConfig, props: {modelValue: 'source'}, attachTo: document.body});
    await wrapper.find('.card-sort__more').trigger('click');
    const options = wrapper.findAll('[role="option"]');
    expect(options).has.length(EXPANSION_GROUPINGS.length);
    await options[2].trigger('click');
    expect(wrapper.emitted('update:modelValue')?.[0]).deep.eq([EXPANSION_GROUPINGS[2]]);
    // Choosing closes the menu
    expect(wrapper.find('[role="listbox"]').exists()).is.false;
  });
});
