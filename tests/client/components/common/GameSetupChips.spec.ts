import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import GameSetupChips from '@/client/components/common/GameSetupChips.vue';
import {boardChip, expansionChips, optionChips, seatChips} from '@/client/components/common/gameSetupChips';
import {setupOptionsFromGame} from '@/common/game/GameSetupOptions';
import {GameOptionsModel} from '@/common/models/GameOptionsModel';
import {RandomMAOptionType} from '@/common/ma/RandomMAOptionType';

// Options of a finished game as the server sends them; unset fields count as off
function gameOptions(options: Partial<GameOptionsModel>): GameOptionsModel {
  return {startingCorporations: 4, startingPreludes: 4, startingCeos: 3, ...options} as GameOptionsModel;
}

describe('GameSetupChips', () => {
  it('shows players, board, expansions and set options in this order', () => {
    const options = setupOptionsFromGame(gameOptions({shuffleMapOption: true, draftVariant: true}));
    const isActive = (expansion: string) => expansion === 'venus';
    const chips = [...seatChips(2, 1), boardChip('tharsis'), ...expansionChips(isActive), ...optionChips(options, isActive, 3)];
    const wrapper = mount(GameSetupChips, {...globalConfig, props: {chips, compact: true}});
    expect(wrapper.findAll('.create-game-summary-chip').map((chip) => chip.text()))
      .deep.eq(['2 players', '1 AI', 'tharsis', 'Base game', 'Venus Next', 'Randomize board tiles', 'Draft']);
    expect(wrapper.classes()).to.include('create-game-summary--compact');
  });

  it('every switched-on setting and changed count becomes a chip', () => {
    const options = setupOptionsFromGame(gameOptions({
      solarPhaseOption: true, undoOption: true, showTimers: true, startingCorporations: 2, randomMA: RandomMAOptionType.LIMITED,
      bannedCards: ['Birds' as never],
    }));
    expect(optionChips(options, () => false, 2).map((chip) => chip.label))
      .deep.eq(['Starting Corporations: 2', 'World Government Terraforming', 'Allow undo', 'Show timers', 'Random limited', 'Card pool']);
  });

  it('options of an expansion only count while it is in play; solo and draft rules like the form', () => {
    const options = setupOptionsFromGame(gameOptions({aresExtremeVariant: true, draftVariant: true, soloTR: true, twoCorpsVariant: true}));
    expect(optionChips(options, () => false, 1).map((chip) => chip.label)).deep.eq(['63 TR solo mode']);
    expect(optionChips(options, (expansion) => expansion === 'ares' || expansion === 'prelude', 2).map((chip) => chip.label))
      .deep.eq(['Extreme', 'Merger', 'Draft']);
    expect(seatChips(1, 0).map((chip) => chip.label)).deep.eq(['Solo']);
  });
});
