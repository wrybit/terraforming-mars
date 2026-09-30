import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import OptionRow from '@/client/components/create/OptionRow.vue';

describe('OptionRow', () => {
  it('shows the label, the info link and the control', () => {
    const wrapper = mount(OptionRow, {
      ...globalConfig,
      props: {label: 'Allow undo', href: 'https://example.com'},
      slots: {default: '<input type="checkbox">'},
    });
    expect(wrapper.text()).includes('Allow undo');
    expect(wrapper.find('a').attributes('href')).eq('https://example.com');
    expect(wrapper.find('input').exists()).is.true;
  });
});
