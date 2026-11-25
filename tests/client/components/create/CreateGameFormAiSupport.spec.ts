import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {nextTick} from 'vue';
import {globalConfig} from '../getLocalVue';
import CreateGameForm from '@/client/components/create/CreateGameForm.vue';
import {useFakeLocalStorage} from '../FakeLocalStorage';
import {BoardName} from '@/common/boards/BoardName';
import {EMPTY_AI_SUPPORT} from '@/common/ai/aiSupportContract';
import {aiSupportInfo, resetAiSupport} from '@/client/utils/aiSupportState';

describe('CreateGameForm and the AI support', () => {
  useFakeLocalStorage();

  function serverAnswers(engine: 'rust' | 'typescript', typescriptFallback: boolean) {
    aiSupportInfo.value = {
      engine,
      typescriptFallback,
      rust: {...EMPTY_AI_SUPPORT, expansions: ['corpera'], boards: [BoardName.THARSIS], options: ['draftVariant']},
    };
  }

  afterEach(() => {
    resetAiSupport();
  });

  async function formWithAiSeat() {
    const wrapper = shallowMount(CreateGameForm, {...globalConfig});
    const vm = wrapper.vm as any;
    vm.expansions = {...vm.expansions, corpera: true, prelude: false, venus: false, promo: false};
    vm.boards = [BoardName.THARSIS];
    vm.randomBoard = false;
    vm.initialDraft = false;
    vm.solarPhaseOption = false;
    vm.aiPlayersCount = 1;
    await nextTick();
    return {wrapper, vm};
  }

  it('marks what the Rust AI can play while it plays new games without a stand-in', async () => {
    serverAnswers('rust', false);
    const {vm} = await formWithAiSeat();
    expect(vm.aiCan('expansion', 'corpera')).is.true;
    expect(vm.aiCan('expansion', 'venus')).is.false;
    expect(vm.aiCan('board', BoardName.THARSIS)).is.true;
    expect(vm.aiCan('option', 'soloTR')).is.false;
  });

  it('shows no marks before the server answered', async () => {
    const {vm} = await formWithAiSeat();
    expect(vm.aiCan('expansion', 'corpera')).is.false;
  });

  it('marks what the TypeScript AI can play while it plays new games', async () => {
    serverAnswers('typescript', true);
    const {vm} = await formWithAiSeat();
    expect(vm.aiCan('expansion', 'venus')).is.true;
    expect(vm.aiCan('expansion', 'colonies')).is.false;
    expect(vm.aiCan('board', BoardName.HELLAS)).is.true;
    expect(vm.aiCan('option', 'twoCorpsVariant')).is.false;
  });

  it('marks only what the Rust AI plays while the admin chose it, with or without the stand-in', async () => {
    serverAnswers('rust', true);
    const {vm} = await formWithAiSeat();
    expect(vm.aiCan('expansion', 'venus')).is.false;
    serverAnswers('rust', false);
    await nextTick();
    expect(vm.aiCan('expansion', 'venus')).is.false;
  });

  it('keeps the AI seats when the TypeScript AI stands in, without a word about it', async () => {
    serverAnswers('rust', true);
    const {wrapper, vm} = await formWithAiSeat();
    vm.expansions = {...vm.expansions, venus: true};
    await nextTick();
    expect(vm.aiPlayersCount).eq(1);
    expect(vm.aiBlockers).deep.eq([]);
    expect(wrapper.text()).not.contains('AI not yet compatible with:');
  });

  it('removes the AI seats and names the reasons without a stand-in', async () => {
    serverAnswers('rust', false);
    const {wrapper, vm} = await formWithAiSeat();
    vm.expansions = {...vm.expansions, venus: true};
    await nextTick();
    await nextTick();
    expect(vm.aiPlayersCount).eq(0);
    expect(wrapper.text()).contains('AI not yet compatible with:');
    // Venus switches World Government Terraforming on along with it
    expect(vm.aiBlockerChips.map((chip: any) => chip.label)).deep.eq(['Venus Next', 'World Government Terraforming']);
  });
});
