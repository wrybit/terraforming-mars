import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import LogAiThinking from '@/client/components/logpanel/LogAiThinking.vue';
import {PublicPlayerModel} from '@/common/models/PlayerModel';

describe('LogAiThinking', () => {
  const players = [{color: 'red', name: 'AI Mira'}] as unknown as Array<PublicPlayerModel>;

  it('shows a spinner and the activity around the player name', () => {
    const wrapper = mount({components: {LogAiThinking}, template: '<ul><LogAiThinking :entries="entries" :players="players" /></ul>', data: () => ({entries: [{color: 'red', text: '${0} is choosing a card', remainingMs: 2400}], players})}, globalConfig);
    const rows = wrapper.findAll('li.log-ai-thinking');
    expect(rows).has.length(1);
    expect(rows[0].find('.log-ai-thinking-spinner').exists()).to.be.true;
    expect(rows[0].find('.log-player').text()).eq('AI Mira');
    expect(rows[0].find('.log-line-content').text()).eq('AI Mira is choosing a card...');
    expect(rows[0].find('.log-ai-thinking-countdown').text()).eq('3');
  });

  it('shows nothing while no AI decides', () => {
    const wrapper = mount({components: {LogAiThinking}, template: '<ul><LogAiThinking :entries="[]" :players="players" /></ul>', data: () => ({players})}, globalConfig);
    expect(wrapper.findAll('li')).has.length(0);
  });
});
