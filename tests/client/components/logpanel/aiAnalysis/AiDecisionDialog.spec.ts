import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../../getLocalVue';
import {fakeViewModel} from '../../testHelpers';
import AiDecisionDialog from '@/client/components/logpanel/aiAnalysis/AiDecisionDialog.vue';
import {aiFeedbackState, closeAiDecision, openAiDecision} from '@/client/components/logpanel/aiAnalysis/aiFeedbackState';
import {LogMessage} from '@/common/logs/LogMessage';
import {LogMessageType} from '@/common/logs/LogMessageType';

function mountDialog() {
  return mount(AiDecisionDialog, {
    ...globalConfig,
    global: {
      ...globalConfig.global,
      // The modal shell teleports and animates; its content is what matters here
      stubs: {...globalConfig.global.stubs, SidebarModal: {props: ['open'], template: '<div v-if="open"><slot/></div>'}},
    },
  });
}

describe('AiDecisionDialog', () => {
  afterEach(() => {
    closeAiDecision();
    aiFeedbackState.ratings = [];
  });

  it('stays closed without a row', () => {
    expect(mountDialog().find('[data-test="ai-decision-dialog"]').exists()).is.false;
  });

  it('shows the options of the decision and the rating choices', async () => {
    const wrapper = mountDialog();
    openAiDecision({
      messageId: '3.x',
      decisionId: 'd1',
      color: 'red',
      messages: [new LogMessage(LogMessageType.DEFAULT, 'Test line', [])],
    }, {
      id: 'd1', kind: 'draft', title: 'Select a card',
      options: [{label: 'Algae', card: 'Algae', value: 2.5}, {label: 'Ants', card: 'Ants', value: 7, chosen: true}],
    }, fakeViewModel());
    await wrapper.vm.$nextTick();
    const options = wrapper.findAll('.ai-decision-dialog__option');
    expect(options.map((option) => option.find('.ai-decision-dialog__label').text())).deep.eq(['Ants', 'Algae']);
    expect(options[0].classes()).contains('ai-decision-dialog__option--chosen');
    expect(wrapper.find('[data-test="ai-rating-up"]').exists()).is.true;
    // Comment field only after an emoji was chosen
    expect(wrapper.find('[data-test="ai-rating-text"]').exists()).is.false;
    await wrapper.find('[data-test="ai-rating-down"]').trigger('click');
    expect(wrapper.find('[data-test="ai-rating-text"]').exists()).is.true;
  });

  it('preselects the rating clicked in the hover bar', async () => {
    const wrapper = mountDialog();
    openAiDecision({messageId: '4.x', color: 'red', messages: [new LogMessage(LogMessageType.DEFAULT, 'Test line', [])]},
      undefined, fakeViewModel(), 'flag');
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-test="ai-rating-flag"]').attributes('aria-checked')).eq('true');
    expect(wrapper.find('[data-test="ai-rating-text"]').exists()).is.true;
  });
});
