import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import AiCanMark from '@/client/components/create/AiCanMark.vue';
import SeatIcon from '@/client/components/create/SeatIcon.vue';
import ChoiceChip from '@/client/components/create/ChoiceChip.vue';
import OptionRow from '@/client/components/create/OptionRow.vue';

describe('AiCanMark', () => {
  it('shows the robot of the AI seat row and names what it means', () => {
    const wrapper = mount(AiCanMark, {...globalConfig});
    expect(wrapper.findComponent(SeatIcon).props('kind')).eq('ai');
    expect(wrapper.attributes('aria-label')).eq('The AI can do this');
  });

  it('stands right behind the name of a chip and an option row, only when asked for', () => {
    const chip = mount(ChoiceChip, {...globalConfig, props: {label: 'Colonies', aiCan: true}});
    expect(chip.find('.create-game-chip-name .create-game-chip-label + .ai-can-mark').exists()).is.true;
    expect(mount(ChoiceChip, {...globalConfig, props: {label: 'Colonies'}}).find('.ai-can-mark').exists()).is.false;
    const row = mount(OptionRow, {...globalConfig, props: {label: 'Draft variant', aiCan: true}});
    expect(row.find('.create-game-option-name .ai-can-mark').exists()).is.true;
  });
});
