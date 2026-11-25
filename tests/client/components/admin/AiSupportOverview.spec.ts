import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import AiSupportOverview from '@/client/components/admin/AiSupportOverview.vue';
import {aiSupportInfo, resetAiSupport} from '@/client/utils/aiSupportState';
import {EMPTY_AI_SUPPORT} from '@/common/ai/aiSupportContract';
import {BoardName} from '@/common/boards/BoardName';

// Marks of a row as "TS Rust", e.g. "✓✗" (green or red logo)
function marksOf(wrapper: ReturnType<typeof mount>, label: string): string {
  const row = wrapper.findAll('.ai-support-overview-row').find((candidate) => candidate.find('.ai-support-overview-setting').text() === label);
  return row === undefined ? 'missing' : row.findAll('.ai-support-overview-logo').map((logo) => logo.classes('ai-support-overview-logo--yes') ? '✓' : '✗').join('');
}

describe('AiSupportOverview', () => {
  afterEach(() => resetAiSupport());

  it('lists what both programs play and marks the active one', async () => {
    const wrapper = mount(AiSupportOverview, {...globalConfig});
    aiSupportInfo.value = {engine: 'rust', typescriptFallback: true,
      rust: {...EMPTY_AI_SUPPORT, botVersion: 'abc123', aiVersion: '1.9', generated: '2026-11-20T10:00:00Z', expansions: ['venus'], boards: [BoardName.THARSIS]}};
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.ai-support-overview-note').text()).contains('Rust').contains('active').contains('Version 1.9').contains('abc123');
    expect(wrapper.find('.ai-support-overview-engine--active').text()).eq('Rust');
    expect(marksOf(wrapper, 'Base game')).eq('✓✓');
    expect(marksOf(wrapper, 'Venus Next')).eq('✓✓');
    expect(marksOf(wrapper, 'Prelude 2')).eq('✓✗');
    expect(marksOf(wrapper, 'tharsis')).eq('✓✓');
    expect(wrapper.findAll('.ai-support-overview-stack')).has.length(2);
  });

  it('says the Rust AI plays nothing without a support file', async () => {
    const wrapper = mount(AiSupportOverview, {...globalConfig});
    aiSupportInfo.value = {engine: 'typescript', typescriptFallback: true, rust: EMPTY_AI_SUPPORT};
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).contains('rust-ai-support.json');
    expect(marksOf(wrapper, 'Base game')).eq('✓✗');
  });
});
