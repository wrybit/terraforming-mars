import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import CollapsibleSection from '@/client/components/create/CollapsibleSection.vue';

describe('CollapsibleSection', () => {
  beforeEach(() => localStorage.clear());

  it('starts closed, shows the note, opens on click and remembers it', async () => {
    const wrapper = mount(CollapsibleSection, {...globalConfig, props: {title: 'Card pool', storageKey: 'test', changed: 'Changed'}, slots: {default: '<p class="content">x</p>'}});
    expect(wrapper.find('.create-game-collapsible-body').isVisible()).is.false;
    expect(wrapper.find('.create-game-changed').text()).eq('Changed');

    await wrapper.find('button.create-game-collapsible-toggle').trigger('click');
    expect(wrapper.find('.create-game-changed').exists()).is.false;
    expect(localStorage.getItem('create-game-open-test')).eq('1');

    const again = mount(CollapsibleSection, {...globalConfig, props: {title: 'Card pool', storageKey: 'test'}});
    expect(again.find('.create-game-collapsible').classes()).contains('create-game-collapsible--open');
  });

  it('not collapsible: always open, no switch', () => {
    const wrapper = mount(CollapsibleSection, {...globalConfig, props: {title: 'Official', storageKey: 'test2', collapsible: false, changed: 'x'}});
    expect(wrapper.find('button').exists()).is.false;
    expect(wrapper.find('.create-game-changed').exists()).is.false;
  });
});
