import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import LobbyGameTimeline from '@/client/components/lobby/LobbyGameTimeline.vue';
import {LobbyGameProgress} from '@/common/lobby/LobbyModel';

const PROGRESS: LobbyGameProgress = {
  generation: 3,
  terraforming: 0.21,
  playedMs: 1_500_000,
  generations: [
    {number: 1, durationMs: 600_000, steps: {}},
    {number: 2, durationMs: 500_000, steps: {temperature: 2, oceans: 1}},
    {number: 3, durationMs: 400_000, steps: {oxygen: 1}},
  ],
  marks: [{kind: 'milestone', name: 'Terraformer', player: 'Ann', color: 'red', generation: 2, atMs: 900_000}],
  remainingMs: 3_000_000,
};

describe('LobbyGameTimeline', () => {
  it('shows one column per generation, one block per raised parameter and the marks', () => {
    const wrapper = mount(LobbyGameTimeline, {...globalConfig, props: {progress: PROGRESS}});
    expect(wrapper.findAll('.lobby-timeline-column')).has.length(3);
    expect(wrapper.findAll('.lobby-timeline-column')[1].findAll('i')).has.length(2);
    expect(wrapper.findAll('.lobby-timeline-mark')).has.length(1);
    expect(wrapper.find('.lobby-timeline-rest').exists()).is.true;
    expect(wrapper.find('.lobby-timeline-meta b').text()).eq('21');
  });

  it('falls back to the plain bar without a course (AI training games)', () => {
    const wrapper = mount(LobbyGameTimeline, {...globalConfig, props: {progress: {generation: 4, terraforming: 0.5, playedMs: 60_000}}});
    expect(wrapper.find('.lobby-timeline-column').exists()).is.false;
    expect(wrapper.find('.lobby-game-progress').exists()).is.true;
  });
});
