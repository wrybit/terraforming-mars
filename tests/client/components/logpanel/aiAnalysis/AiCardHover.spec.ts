import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../../getLocalVue';
import AiCardHover from '@/client/components/logpanel/aiAnalysis/AiCardHover.vue';
import {optionCard} from '@/client/components/logpanel/aiAnalysis/aiDecisionOptions';

describe('AiCardHover', () => {
  it('shows the card while the mouse is over its name', async () => {
    const wrapper = mount(AiCardHover, {...globalConfig, props: {card: 'Algae'}, slots: {default: 'Algae'}, attachTo: document.body});
    expect(document.querySelector('.ai-card-hover__preview')).is.null;
    await wrapper.find('.ai-card-hover').trigger('pointerenter', {pointerType: 'mouse'});
    expect(document.querySelector('.ai-card-hover__preview')).is.not.null;
    await wrapper.find('.ai-card-hover').trigger('pointerleave', {pointerType: 'mouse'});
    expect(document.querySelector('.ai-card-hover__preview')).is.null;
    wrapper.unmount();
  });

  it('has no preview without a known card', () => {
    const wrapper = mount(AiCardHover, {...globalConfig, props: {card: 'Landlord'}, slots: {default: 'Landlord'}});
    expect(wrapper.find('.ai-card-hover--card').exists()).is.false;
  });

  it('finds the card of an option, but not of awards', () => {
    expect(optionCard({label: 'Play project card: Algae'})).eq('Algae');
    expect(optionCard({label: 'Fund an award (8 M€): Landlord'})).is.undefined;
    expect(optionCard({label: 'Pass for this generation'})).is.undefined;
  });
});
