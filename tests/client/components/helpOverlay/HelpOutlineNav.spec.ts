import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import HelpOutlineNav from '@/client/components/helpOverlay/HelpOutlineNav.vue';

describe('HelpOutlineNav', () => {
  const nodes = [
    {id: 'a', label: 'Jede Generation', children: [{id: 'b', label: 'Aktionsphase', children: []}]},
    {id: 'c', label: 'Spielende', children: []},
  ];

  it('renders nested nodes and marks the active one', () => {
    const wrapper = mount(HelpOutlineNav, {...globalConfig, props: {nodes, activeId: 'b'}});
    expect(wrapper.findAll('.help-outline-link').map((link) => link.text())).deep.eq(['Jede Generation', 'Aktionsphase', 'Spielende']);
    expect(wrapper.find('.help-outline-link--active').text()).eq('Aktionsphase');
  });

  it('emits the selected id, also from nested levels', async () => {
    const wrapper = mount(HelpOutlineNav, {...globalConfig, props: {nodes, activeId: undefined}});
    await wrapper.findAll('.help-outline-link')[1].trigger('click');
    expect(wrapper.emitted('select')?.[0]).deep.eq(['b']);
  });
});
