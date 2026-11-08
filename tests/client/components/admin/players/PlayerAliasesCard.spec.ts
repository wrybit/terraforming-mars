import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../../getLocalVue';
import PlayerAliasesCard from '@/client/components/admin/players/PlayerAliasesCard.vue';

describe('PlayerAliasesCard', () => {
  it('strikes the old name and emits unmerge', async () => {
    const wrapper = mount(PlayerAliasesCard, {...globalConfig, props: {aliases: [{from: 'jens', to: 'Jens', createdTimeMs: 0}], busy: false}});
    expect(wrapper.find('s').text()).eq('jens');
    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('unmerge')?.[0]).deep.eq(['jens']);
  });
});
