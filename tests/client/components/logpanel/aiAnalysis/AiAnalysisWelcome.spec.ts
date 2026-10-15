import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../../getLocalVue';
import AiAnalysisWelcome from '@/client/components/logpanel/aiAnalysis/AiAnalysisWelcome.vue';
import {PlayerViewModel} from '@/common/models/PlayerModel';

const SEEN_KEY = 'tm-ai-analysis-welcome-seen';

function view(generation: number, aiAnalysis: boolean): PlayerViewModel {
  return {game: {generation, gameOptions: {aiAnalysis}}} as unknown as PlayerViewModel;
}

describe('AiAnalysisWelcome', () => {
  beforeEach(() => localStorage.removeItem(SEEN_KEY));
  afterEach(() => localStorage.removeItem(SEEN_KEY));

  it('waits for the end of the first generation', () => {
    const wrapper = mount(AiAnalysisWelcome, {...globalConfig, props: {playerView: view(1, true)}});
    expect(wrapper.find('[data-test="ai-analysis-welcome"]').exists()).is.false;
  });

  it('shows from generation 2 in analysis games only', () => {
    expect(mount(AiAnalysisWelcome, {...globalConfig, props: {playerView: view(2, true)}}).find('[data-test="ai-analysis-welcome"]').exists()).is.true;
    expect(mount(AiAnalysisWelcome, {...globalConfig, props: {playerView: view(2, false)}}).find('[data-test="ai-analysis-welcome"]').exists()).is.false;
  });

  it('shows only once per browser', async () => {
    const wrapper = mount(AiAnalysisWelcome, {...globalConfig, props: {playerView: view(3, true)}});
    await wrapper.find('.ai-analysis-welcome__go').trigger('click');
    expect(wrapper.find('[data-test="ai-analysis-welcome"]').exists()).is.false;
    expect(mount(AiAnalysisWelcome, {...globalConfig, props: {playerView: view(3, true)}}).find('[data-test="ai-analysis-welcome"]').exists()).is.false;
  });
});
