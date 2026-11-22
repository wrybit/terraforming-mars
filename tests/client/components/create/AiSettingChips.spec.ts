import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import AiSettingChips from '@/client/components/create/AiSettingChips.vue';

describe('AiSettingChips', () => {
  it('shows a chip per setting with picture, icon or switch', () => {
    const wrapper = mount(AiSettingChips, {...globalConfig, props: {chips: [
      {key: 'a', label: 'Venus Next', iconClass: 'create-game-expansion-icon expansion-icon-venus'},
      {key: 'b', label: 'Spice', picture: 'spice.png'},
      {key: 'c', label: 'Draft variant'},
    ]}});
    const chips = wrapper.findAll('.create-game-summary-chip');
    expect(chips.map((chip) => chip.text())).deep.eq(['Venus Next', 'Spice', 'Draft variant']);
    expect(chips[0].find('.expansion-icon-venus').exists()).is.true;
    expect(chips[1].find('img').attributes('src')).eq('spice.png');
    expect(chips[2].find('.create-game-summary-toggle').exists()).is.true;
  });
});
