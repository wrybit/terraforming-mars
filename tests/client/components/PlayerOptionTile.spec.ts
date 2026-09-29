import {mount} from '@vue/test-utils';
import {globalConfig} from './getLocalVue';
import {expect} from 'chai';
import PlayerOptionTile from '@/client/components/PlayerOptionTile.vue';
import {PublicPlayerModel} from '@/common/models/PlayerModel';

describe('PlayerOptionTile', () => {
  const player = {name: 'beta', color: 'red', steel: 3, steelProduction: 1} as PublicPlayerModel;

  it('shows the player in its color with the state before and after', () => {
    const wrapper = mount(PlayerOptionTile, {
      ...globalConfig,
      props: {color: 'red', player, groupName: 'g', effect: {resource: 'steel', target: 'stock', amount: 4}},
    });
    expect(wrapper.find('label').classes()).contains('player_translucent_bg_color_red');
    expect(wrapper.find('.player-option-name').text()).eq('beta');
    const after = wrapper.findAll('.player-option-after');
    expect(after).has.length(1);
    expect(after[0].text()).eq('→0');
  });

  it('shows only the name without a resource', () => {
    const wrapper = mount(PlayerOptionTile, {
      ...globalConfig,
      props: {color: 'red', player, groupName: 'g'},
    });
    expect(wrapper.find('.player-option-resource').exists()).is.false;
  });

  it('emits the color when selected', async () => {
    const wrapper = mount(PlayerOptionTile, {
      ...globalConfig,
      props: {color: 'red', player, groupName: 'g'},
    });
    await wrapper.find('input').trigger('change');
    expect(wrapper.emitted('select')?.[0]).deep.eq(['red']);
  });
});
