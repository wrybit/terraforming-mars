import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import AiSupportOverview from '@/client/components/admin/AiSupportOverview.vue';
import {aiSupportInfo, resetAiSupport} from '@/client/utils/aiSupportState';
import {EMPTY_AI_SUPPORT} from '@/common/ai/aiSupportContract';
import {BoardName} from '@/common/boards/BoardName';

function columnTexts(wrapper: ReturnType<typeof mount>): Array<string> {
  return wrapper.findAll('.ai-support-overview-column').map((column) => column.text());
}

describe('AiSupportOverview', () => {
  afterEach(() => resetAiSupport());

  it('lists what both programs play and marks the active one', async () => {
    const wrapper = mount(AiSupportOverview, {...globalConfig});
    aiSupportInfo.value = {engine: 'rust', typescriptFallback: true,
      rust: {...EMPTY_AI_SUPPORT, botVersion: 'abc123', aiVersion: '1.9', generated: '2026-11-20T10:00:00Z', expansions: ['venus'], boards: [BoardName.THARSIS]}};
    await wrapper.vm.$nextTick();
    const [typescript, rust] = columnTexts(wrapper);
    expect(typescript).contains('TypeScript').contains('Base game').contains('Prelude 2').not.contains('active');
    expect(rust).contains('active').contains('Version 1.9').contains('abc123').contains('Venus Next').contains('tharsis').not.contains('Prelude');
  });

  it('says the Rust AI plays nothing without a support file', async () => {
    const wrapper = mount(AiSupportOverview, {...globalConfig});
    aiSupportInfo.value = {engine: 'typescript', typescriptFallback: true, rust: EMPTY_AI_SUPPORT};
    await wrapper.vm.$nextTick();
    expect(columnTexts(wrapper)[1]).contains('rust-ai-support.json');
    expect(wrapper.findAll('.ai-support-overview-column')[1].findAll('.create-game-summary-chip')).has.length(0);
  });
});
