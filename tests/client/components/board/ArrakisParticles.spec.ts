import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {vi} from 'vitest';
import {globalConfig} from '../getLocalVue';
import ArrakisParticles, {ParticleFlow} from '@/client/components/board/ArrakisParticles.vue';

const particle = (radius: number): ParticleFlow => ({
  path: 'M 0 0 L 10 0', radius, colour: '#ffd08a', travel: 4, travelBegin: 1, blink: 2, blinkBegin: 0.5, opacity: [0.1, 1, 0.1],
});

describe('ArrakisParticles', () => {
  it('draws one dot per particle', () => {
    const wrapper = mount(ArrakisParticles, {...globalConfig, props: {particles: [particle(1), particle(2)]}});
    expect(wrapper.findAll('.arrakis-particles__dot')).has.length(2);
  });

  it('restarts the animations only when the particles really change', async () => {
    // The parents hand over a new array with the same content on every game update
    const start = vi.spyOn((ArrakisParticles as unknown as {methods: {start: () => void}}).methods, 'start');
    try {
      const wrapper = mount(ArrakisParticles, {...globalConfig, props: {particles: [particle(1)]}});
      expect(start.mock.calls).has.length(1);
      await wrapper.setProps({particles: [particle(1)]});
      await wrapper.vm.$nextTick();
      expect(start.mock.calls).has.length(1);
      await wrapper.setProps({particles: [particle(1), particle(2)]});
      await wrapper.vm.$nextTick();
      expect(start.mock.calls).has.length(2);
    } finally {
      start.mockRestore();
    }
  });
});
