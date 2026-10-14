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
    const line = new LogMessage(LogMessageType.DEFAULT, 'Test line', []);
    const target = {messageId: '3.x', decisionId: 'g1:1', color: 'red' as const, messages: [line], row: {type: 'message' as const, message: line, indexes: [0]}};
    const summary = {
      id: 'g1:1', kind: 'draft', title: 'Select a card', saveId: 2, generation: 1,
      options: [{label: 'Algae', card: 'Algae', value: 2.5}, {label: 'Ants', card: 'Ants', value: 7, chosen: true}],
    };
    openAiDecision(target, [target], new Map([['g1:1', summary]]), fakeViewModel());
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
    const line = new LogMessage(LogMessageType.DEFAULT, 'Test line', []);
    const target = {messageId: '4.x', color: 'red' as const, messages: [line], row: {type: 'message' as const, message: line, indexes: [0]}};
    openAiDecision(target, [target], new Map(), fakeViewModel(), 'flag');
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-test="ai-rating-flag"]').attributes('aria-checked')).eq('true');
    expect(wrapper.find('[data-test="ai-rating-text"]').exists()).is.true;
  });

  it('steps to the next AI row with the arrow key', async () => {
    const wrapper = mountDialog();
    const first = new LogMessage(LogMessageType.DEFAULT, 'First line', []);
    const second = new LogMessage(LogMessageType.DEFAULT, 'Second line', []);
    const targets = [first, second].map((message, index) => ({messageId: index + '.x', color: 'red' as const, messages: [message], row: {type: 'message' as const, message, indexes: [index]}}));
    openAiDecision(targets[0], targets, new Map(), fakeViewModel());
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-test="ai-decision-previous"]').attributes('disabled')).is.not.undefined;
    window.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowDown'}));
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).contains('Second line');
    expect(wrapper.find('[data-test="ai-decision-next"]').attributes('disabled')).is.not.undefined;
  });
});
