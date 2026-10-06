import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import ChoiceChip from '@/client/components/create/ChoiceChip.vue';

describe('ChoiceChip', () => {
  it('shows the label and the selected state', () => {
    const wrapper = mount(ChoiceChip, {...globalConfig, props: {label: 'Venus Next', selected: true}});
    expect(wrapper.text()).includes('Venus Next');
    expect(wrapper.classes()).includes('create-game-chip--selected');
  });

  it('emits select on click and keyboard', async () => {
    const wrapper = mount(ChoiceChip, {...globalConfig, props: {label: 'Ares'}});
    await wrapper.trigger('click');
    await wrapper.trigger('keydown', {key: 'Enter'});
    expect(wrapper.emitted('select')).has.length(2);
  });

  it('does not select when the info link is clicked', async () => {
    const wrapper = mount(ChoiceChip, {...globalConfig, props: {label: 'Ares', href: 'https://example.com'}});
    await wrapper.find('a').trigger('click');
    expect(wrapper.emitted('select')).is.undefined;
  });

  it('a locked chip (base game) stays selected and ignores clicks', async () => {
    const wrapper = mount(ChoiceChip, {...globalConfig, props: {label: 'Base game', selected: true, locked: true}});
    await wrapper.trigger('click');
    await wrapper.trigger('keydown', {key: 'Enter'});
    expect(wrapper.emitted('select')).is.undefined;
    expect(wrapper.classes()).includes('create-game-chip--locked');
    expect(wrapper.attributes('aria-disabled')).eq('true');
  });
});
