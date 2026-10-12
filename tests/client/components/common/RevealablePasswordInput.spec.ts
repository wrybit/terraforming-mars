import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {vi} from 'vitest';
import {globalConfig} from '../getLocalVue';
import RevealablePasswordInput, {partlyRevealed} from '@/client/components/common/RevealablePasswordInput.vue';

describe('RevealablePasswordInput', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('masks all but the first characters', () => {
    expect(partlyRevealed('abcd', 0)).eq('••••');
    expect(partlyRevealed('abcd', 2)).eq('ab••');
    expect(partlyRevealed('abcd', 4)).eq('abcd');
  });

  it('reveals character by character and ends as a plain text field', async () => {
    vi.useFakeTimers();
    const wrapper = mount(RevealablePasswordInput, {...globalConfig, props: {modelValue: 'abc'}});
    const input = () => wrapper.find('input').element as HTMLInputElement;
    expect(input().type).eq('password');
    await wrapper.find('button').trigger('click');
    expect(input().value).eq('•••');
    vi.advanceTimersByTime(42);
    await wrapper.vm.$nextTick();
    expect(input().value).eq('a••');
    vi.advanceTimersByTime(42 * 2);
    await wrapper.vm.$nextTick();
    expect(input().value).eq('abc');
    expect(input().type).eq('text');
    expect(wrapper.find('button').attributes('aria-pressed')).eq('true');
  });

  it('passes typed text on', async () => {
    const wrapper = mount(RevealablePasswordInput, {...globalConfig, props: {modelValue: ''}});
    await wrapper.find('input').setValue('secret');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).deep.eq(['secret']);
  });
});
