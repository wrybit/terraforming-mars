import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import RustAiMark from '@/client/components/create/RustAiMark.vue';
import SeatIcon from '@/client/components/create/SeatIcon.vue';
import ChoiceChip from '@/client/components/create/ChoiceChip.vue';
import OptionRow from '@/client/components/create/OptionRow.vue';

describe('RustAiMark', () => {
  it('shows the robot of the AI seat row and names what it means', () => {
    const wrapper = mount(RustAiMark, {...globalConfig});
    expect(wrapper.findComponent(SeatIcon).props('kind')).eq('ai');
    expect(wrapper.attributes('aria-label')).eq('New β can do this');
  });

  it('stands right behind the name of a chip and an option row, only when asked for', () => {
    const chip = mount(ChoiceChip, {...globalConfig, props: {label: 'Colonies', rustAi: true}});
    expect(chip.find('.create-game-chip-name .create-game-chip-label + .rust-ai-mark').exists()).is.true;
    expect(mount(ChoiceChip, {...globalConfig, props: {label: 'Colonies'}}).find('.rust-ai-mark').exists()).is.false;
    const row = mount(OptionRow, {...globalConfig, props: {label: 'Draft variant', rustAi: true}});
    expect(row.find('.create-game-option-name .rust-ai-mark').exists()).is.true;
  });
});
