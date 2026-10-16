import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import HotkeyList from '@/client/components/hotkeys/HotkeyList.vue';

describe('HotkeyList', () => {
  it('makes only editable rows clickable in edit mode', async () => {
    const wrapper = mount(HotkeyList, {...globalConfig, props: {editing: true}});
    const editable = wrapper.findAll('button.hotkey-row');
    expect(editable.length).to.be.greaterThan(0);
    expect(wrapper.findAll('.hotkey-row--locked').length).to.be.greaterThan(0);
    await editable[0].trigger('click');
    expect(wrapper.emitted('capture')).has.length(1);
  });
});
