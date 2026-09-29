import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {vi} from 'vitest';
import {globalConfig} from '../getLocalVue';
import GameOverNotice from '@/client/components/gameend/GameOverNotice.vue';
import {PlayerId} from '@/common/Types';

describe('GameOverNotice', () => {
  const participantId = 'p-notice' as PlayerId;

  beforeEach(() => {
    sessionStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('verlinkt die Ergebnisseite', () => {
    const wrapper = mount(GameOverNotice, {...globalConfig, props: {participantId}});
    expect(wrapper.find('a').attributes('href')).eq('the-end?id=p-notice');
  });

  it('merkt sich die Weiterleitung und kündigt sie beim zweiten Öffnen nicht mehr an', async () => {
    const assign = vi.fn();
    vi.stubGlobal('location', {...window.location, assign});
    const first = mount(GameOverNotice, {...globalConfig, props: {participantId, redirectDelayMilliseconds: 10}});
    await first.vm.$nextTick();
    expect(first.find('.game-over-notice__hint').exists()).is.true;
    vi.advanceTimersByTime(10);
    expect(assign.mock.calls).deep.eq([['the-end?id=p-notice']]);

    const second = mount(GameOverNotice, {...globalConfig, props: {participantId}});
    await second.vm.$nextTick();
    expect(second.find('.game-over-notice__hint').exists()).is.false;
    vi.unstubAllGlobals();
  });
});
