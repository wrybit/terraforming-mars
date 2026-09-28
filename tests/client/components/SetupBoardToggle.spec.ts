import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from './getLocalVue';
import SetupBoardToggle from '@/client/components/SetupBoardToggle.vue';
import {setupBoardCollapsed} from '@/client/components/setupBoardCollapsed';

describe('SetupBoardToggle', () => {
  afterEach(() => {
    setupBoardCollapsed.value = false;
  });

  it('toggles the shared collapsed state', async () => {
    setupBoardCollapsed.value = false;
    const wrapper = mount(SetupBoardToggle, {...globalConfig});
    const button = wrapper.find('button.setup-board-toggle');
    expect(button.attributes('aria-pressed')).eq('false');
    expect(button.text()).to.contain('Hide board');

    await button.trigger('click');
    expect(setupBoardCollapsed.value).is.true;
    expect(button.attributes('aria-pressed')).eq('true');
    expect(button.text()).to.contain('Show board');

    await button.trigger('click');
    expect(setupBoardCollapsed.value).is.false;
  });
});
