import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import LogMilestonesSwitches from '@/client/components/logpanel/LogMilestonesSwitches.vue';

describe('LogMilestonesSwitches', () => {
  it('shows both switches and emits their new state', async () => {
    const wrapper = mount(LogMilestonesSwitches, {...globalConfig, props: {autoOpen: true, separate: false}});
    expect(wrapper.find('[data-test=log-milestones-auto]').exists()).to.be.true;
    await wrapper.find('[data-test=log-milestones-separate] input').setValue(true);
    expect(wrapper.emitted('separate')?.[0]).to.deep.eq([true]);
    await wrapper.find('[data-test=log-milestones-auto] input').setValue(false);
    expect(wrapper.emitted('autoOpen')?.[0]).to.deep.eq([false]);
  });

  it('leaves out "open on my turn" in the separate box', () => {
    const wrapper = mount(LogMilestonesSwitches, {...globalConfig, props: {separateOnly: true, separate: true, corner: true}});
    expect(wrapper.find('[data-test=log-milestones-auto]').exists()).to.be.false;
    expect(wrapper.classes()).to.contain('log-milestones-toggles--corner');
  });
});
