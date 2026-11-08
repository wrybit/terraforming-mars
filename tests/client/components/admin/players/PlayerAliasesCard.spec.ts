import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../../getLocalVue';
import PlayerAliasesCard from '@/client/components/admin/players/PlayerAliasesCard.vue';

describe('PlayerAliasesCard', () => {
  it('strikes the old name and emits unmerge', async () => {
    const wrapper = mount(PlayerAliasesCard, {...globalConfig, props: {aliases: [{id: 'a1', from: 'jens', to: 'Jens', createdTimeMs: 0}, {id: 'a2', from: 'Blue', to: 'Jens', createdTimeMs: 0, gameIds: ['g1', 'g2']}], busy: false}});
    expect(wrapper.find('s').text()).eq('jens');
    // One-time merges say how many games they cover
    expect(wrapper.findAll('.admin-players-alias-date')[1].text()).contains('2');
    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('unmerge')?.[0]).deep.eq(['a1']);
  });
});
