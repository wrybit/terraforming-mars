import {mount, flushPromises} from '@vue/test-utils';
import {expect} from 'chai';
import {vi} from 'vitest';
import {globalConfig} from '../getLocalVue';
import DecisionLogPage from '@/client/components/decisionLog/DecisionLogPage.vue';
import {DecisionRecord, DecisionTrace, generationSections, moveText, rateDecision} from '@/client/components/decisionLog/decisionLogModel';

const player = {points: 20, tr: 20, stock: [10, 0, 0, 0, 0, 0], production: [2, 0, 0, 0, 0, 0], hand: [], played: []};
function trace(generation: number, seat: number, means: Array<number | null>, chosen: number, extra: Partial<DecisionTrace> = {}): DecisionTrace {
  return {
    player: seat, generation, kind: 'draft', chosen, searchBest: 0, rule: null,
    candidates: means.map((mean, index) => ({move: {kind: 'cards', cards: [`Card ${index}`]}, mean, rollouts: 16, pairedDeviation: 4})),
    players: [player, player], ...extra,
  };
}
const RECORD: DecisionRecord = {
  scores: [80, 70], corporations: ['Tharsis Republic', 'Ecoline'], generation: 2, rollouts: 16,
  decisions: [
    {traces: [trace(1, 0, [10, 2], 0)]},
    {traces: [trace(1, 1, [10, 9.5], 1, {searchBest: 0, rule: 1})]},
    {traces: [trace(2, 0, [5, null], 0)]},
  ],
};

describe('decisionLogModel', () => {
  it('rates a decision against the best option and its measuring error', () => {
    expect(rateDecision(RECORD.decisions[0].traces[0]).tone).eq('good');
    // 0.5 points worse, measuring error 1: within the error
    expect(rateDecision(RECORD.decisions[1].traces[0]).tone).eq('close');
    expect(rateDecision(trace(1, 0, [10, 2], 1, {searchBest: 0, rule: 1})).tone).eq('drop');
    expect(rateDecision(RECORD.decisions[2].traces[0]).tone).eq('single');
  });

  it('groups the decisions by generation and filters them', () => {
    expect(generationSections(RECORD, new Set(['draft']), '').map((section) => section.rows.length)).deep.eq([2, 1]);
    expect(generationSections(RECORD, new Set(['research']), '')).deep.eq([]);
    expect(moveText({kind: 'cards', cards: ['Birds']}, 'draft')).eq('takes Birds');
  });
});

describe('DecisionLogPage', () => {
  it('shows one bar per generation and one block per decision', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(RECORD))));
    const wrapper = mount(DecisionLogPage, {...globalConfig});
    await flushPromises();
    expect(wrapper.findAll('.decision-generation__head').map((head) => head.text())).deep.eq(['Generation 1', 'Generation 2']);
    expect(wrapper.findAll('.decision-block').length).eq(3);
    vi.unstubAllGlobals();
  });

  it('tells a guest that only admins see the log', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', {status: 403})));
    const wrapper = mount(DecisionLogPage, {...globalConfig});
    await flushPromises();
    expect(wrapper.text()).contains('Only admins can see the decision log.');
    vi.unstubAllGlobals();
  });
});
