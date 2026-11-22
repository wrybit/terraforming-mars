import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {nextTick} from 'vue';
import {globalConfig} from '../getLocalVue';
import CreateGameForm from '@/client/components/create/CreateGameForm.vue';
import {useFakeLocalStorage} from '../FakeLocalStorage';
import {BoardName} from '@/common/boards/BoardName';
import {EMPTY_RUST_AI_SUPPORT} from '@/common/ai/RustAiSupport';
import {newAiAvailable} from '@/client/utils/serverStatus';
import {resetRustAiSupport, rustAiSupport} from '@/client/utils/rustAiSupport';

describe('CreateGameForm and the new AI', () => {
  useFakeLocalStorage();

  beforeEach(() => {
    newAiAvailable.value = true;
    rustAiSupport.value = {...EMPTY_RUST_AI_SUPPORT, expansions: ['corpera'], boards: [BoardName.THARSIS], options: ['draftVariant']};
  });

  afterEach(() => {
    newAiAvailable.value = false;
    resetRustAiSupport();
  });

  async function formWithNewAiSeat() {
    const wrapper = shallowMount(CreateGameForm, {...globalConfig});
    const vm = wrapper.vm as any;
    vm.expansions = {...vm.expansions, corpera: true, prelude: false, venus: false, promo: false};
    vm.boards = [BoardName.THARSIS];
    vm.randomBoard = false;
    vm.initialDraft = false;
    vm.solarPhaseOption = false;
    vm.aiPlayersCount = 1;
    await nextTick();
    const seat = vm.players.slice(0, vm.playersCount).find((player: any) => player.aiLevel !== undefined);
    seat.aiEngine = 'rust';
    await nextTick();
    return {wrapper, vm, seat};
  }

  it('marks only what the new AI can play', async () => {
    const {vm} = await formWithNewAiSeat();
    expect(vm.rustAiCan('expansion', 'corpera')).is.true;
    expect(vm.rustAiCan('expansion', 'venus')).is.false;
    expect(vm.rustAiCan('board', BoardName.THARSIS)).is.true;
    expect(vm.rustAiCan('option', 'soloTR')).is.false;
  });

  it('shows no marks and keeps New β selectable before the server answered', async () => {
    const {vm} = await formWithNewAiSeat();
    rustAiSupport.value = undefined;
    vm.expansions = {...vm.expansions, venus: true};
    await nextTick();
    expect(vm.rustAiCan('expansion', 'corpera')).is.false;
    expect(vm.aiEngineOptions.find((option: any) => option.value === 'rust').disabled).is.not.true;
  });

  it('moves a New β seat to Classic while a setting blocks it, and back afterwards', async () => {
    const {wrapper, vm, seat} = await formWithNewAiSeat();
    vm.expansions = {...vm.expansions, venus: true};
    await nextTick();
    expect(seat.aiEngine).eq('ts');
    expect(vm.aiEngineOptions.find((option: any) => option.value === 'rust').disabled).is.true;
    expect(wrapper.text()).contains('New β not yet compatible with:');
    // Venus switches World Government Terraforming on along with it
    expect(vm.rustAiBlockerChips.map((chip: any) => chip.label)).deep.eq(['Venus Next', 'World Government Terraforming']);

    vm.expansions = {...vm.expansions, venus: false};
    await nextTick();
    await nextTick();
    expect(seat.aiEngine).eq('rust');
    expect(wrapper.text()).not.contains('New β not yet compatible with:');
  });
});
