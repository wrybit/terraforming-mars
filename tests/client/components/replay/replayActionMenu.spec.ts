import {expect} from 'chai';
import {CardName} from '@/common/cards/CardName';
import {LogMessageDataType} from '@/common/logs/LogMessageDataType';
import {ReplaySourceMessage, ReplaySourceModel} from '@/common/models/ReplaySourceModel';
import {REPLAY_TAB, replayActionFocus, replayActionMenu} from '@/client/components/replay/replayActionMenu';
import {ReplayPlayerState, ReplayState} from '@/client/components/replay/reconstructReplay';
import {ReplayStep} from '@/client/components/replay/replaySteps';

const line = (message: string, values: Array<string | Array<string>>, viewer?: 'red'): ReplaySourceMessage => ({
  message, data: values.map((value) => ({type: LogMessageDataType.STRING, value} as any)), ...(viewer !== undefined ? {viewer} : {}),
});
const source = (log: Array<ReplaySourceMessage>): ReplaySourceModel => ({players: [], startTemperature: -30, startOxygenLevel: 0, endTiles: [], log});
const step = (line: number, state: number): ReplayStep => ({line, state, generation: 1, actor: 'red'});
const player = (overrides: Partial<ReplayPlayerState> = {}): ReplayPlayerState => ({
  terraformRating: 20, resources: [30, 0, 0, 0, 0, 0], production: [0, 0, 0, 0, 0, 0], hand: [CardName.ASTEROID, CardName.ALGAE],
  unknownHand: 0, played: [], cardResources: {}, actionsThisGeneration: [], ...overrides,
});
const state = (overrides: Partial<ReplayState> = {}): ReplayState => ({
  generation: 1, temperature: -30, oxygenLevel: 0, oceans: 0, tiles: [], milestones: [], awards: [], passed: [], active: undefined,
  players: [player()], ...overrides,
} as ReplayState);
const titleOf = (title: unknown) => typeof title === 'string' ? title : (title as {message: string}).message;

describe('replayActionMenu', () => {
  it('opens the play tab on a played project card, not on a corporation', () => {
    const log = source([line('${0} played ${1}', ['red', CardName.ASTEROID]), line('${0} played ${1}', ['red', CardName.CREDICOR])]);
    expect(replayActionFocus(log, step(0, 0))).deep.eq({tab: REPLAY_TAB.playCard, cards: [CardName.ASTEROID]});
    expect(replayActionFocus(log, step(1, 1))).is.undefined;
  });

  it('takes the sold cards from the private line of the step', () => {
    const log = source([
      line('${0} used ${1} standard project', ['red', CardName.SELL_PATENTS_STANDARD_PROJECT]),
      line('${0} sold ${1} patents', ['red', '2']),
      line('${0} sold ${1}', ['red', [CardName.ASTEROID, CardName.ALGAE]], 'red'),
    ]);
    expect(replayActionFocus(log, step(0, 2))).deep.eq({tab: REPLAY_TAB.sell, cards: [CardName.ASTEROID, CardName.ALGAE]});
  });

  it('preselects the tab and the milestone of the action', () => {
    const log = source([line('${0} claimed ${1} milestone', ['red', 'Builder'])]);
    const focus = replayActionFocus(log, step(0, 0));
    const menu = replayActionMenu(log, state(), player(), ['Terraformer', 'Builder'], ['Banker'], focus);
    const selected = menu.options[menu.initialIdx ?? -1];
    expect(titleOf(selected.title)).eq(REPLAY_TAB.milestone);
    expect((selected as any).initialIdx).eq(1);
  });

  it('builds the tabs from the state before the step', () => {
    const menu = replayActionMenu(source([]), state({awards: [{name: 'Banker', color: 'red'}]} as Partial<ReplayState>), player(),
      [], ['Banker', 'Miner'], undefined);
    const titles = menu.options.map((option) => titleOf(option.title));
    expect(titles).deep.eq([REPLAY_TAB.playCard, REPLAY_TAB.award, REPLAY_TAB.standardProjects, REPLAY_TAB.pass, REPLAY_TAB.sell]);
    // Second award costs 14
    expect((menu.options[1].title as any).data[0].value).eq('14');
    expect(titles[menu.initialIdx ?? -1]).eq(REPLAY_TAB.playCard);
  });
});
