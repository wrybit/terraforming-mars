import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../../getLocalVue';
import PlayerMergeSuggestions from '@/client/components/admin/players/PlayerMergeSuggestions.vue';

describe('PlayerMergeSuggestions', () => {
  it('is hidden without suggestions and emits the chosen one', async () => {
    expect(mount(PlayerMergeSuggestions, {...globalConfig, props: {suggestions: []}}).find('.admin-players-suggestions').exists()).is.false;
    const wrapper = mount(PlayerMergeSuggestions, {...globalConfig, props: {suggestions: [{from: 'jens', to: 'Jens'}]}});
    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('merge')?.[0]).deep.eq([{from: 'jens', to: 'Jens'}]);
  });
});
