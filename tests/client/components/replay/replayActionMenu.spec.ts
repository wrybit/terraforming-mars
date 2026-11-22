import {expect} from 'chai';
import {CardName} from '@/common/cards/CardName';
import {LogMessageDataType} from '@/common/logs/LogMessageDataType';
import {ReplaySourceMessage, ReplaySourceModel} from '@/common/models/ReplaySourceModel';
import {REPLAY_TAB, replayActionFocus, replayActionMenu, replayMoneyReliable} from '@/client/components/replay/replayActionMenu';
import {ReplayPlayerState, ReplayState} from '@/client/components/replay/reconstructReplay';
import {ReplayStep} from '@/client/components/replay/replaySteps';
import {replayPlacedSpaces} from '@/client/components/replay/replayPlacedSpaces';
import {readReplayPlayer, writeReplayPlayer} from '@/client/components/replay/replayAddress';

const line = (message: string, values: Array<string | Array<string>>, viewer?: 'red' | 'blue'): ReplaySourceMessage => ({
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
  it('opens the play tab on a played project card, the corporation tab on a corporation', () => {
    const log = source([line('${0} played ${1}', ['red', CardName.ASTEROID]), line('${0} played ${1}', ['red', CardName.CREDICOR])]);
    expect(replayActionFocus(log, step(0, 0))).deep.eq({tab: REPLAY_TAB.playCard, cards: [CardName.ASTEROID]});
    expect(replayActionFocus(log, step(1, 1))).deep.eq({tab: REPLAY_TAB.corporation, cards: [CardName.CREDICOR]});
  });

  it('takes the sold cards from the private line of the step', () => {
    const log = source([
      line('${0} used ${1} standard project', ['red', CardName.SELL_PATENTS_STANDARD_PROJECT]),
      line('${0} sold ${1} patents', ['red', '2']),
      line('${0} sold ${1}', ['red', [CardName.ASTEROID, CardName.ALGAE]], 'red'),
    ]);
    expect(replayActionFocus(log, step(0, 2))).deep.eq({tab: REPLAY_TAB.sell, cards: [CardName.ASTEROID, CardName.ALGAE]});
  });

  it('marks drawn and bought cards in the hand, only those the actor sees', () => {
    const log = source([
      line('${0} ${1} ${2} card(s)', ['red', 'bought', '2']),
      line('${0} bought ${1}', ['red', [CardName.ASTEROID, CardName.ALGAE]], 'red'),
      line('${0} drew ${1}', ['blue', [CardName.BIRDS]], 'blue'),
    ]);
    expect(replayActionFocus(log, step(0, 2))).deep.eq({tab: REPLAY_TAB.playCard, cards: [CardName.ASTEROID, CardName.ALGAE], added: true});
  });

  it('preselects the tab and the milestone of the action', () => {
    const log = source([line('${0} claimed ${1} milestone', ['red', 'Builder'])]);
    const focus = replayActionFocus(log, step(0, 0));
    const menu = replayActionMenu(log, state(), player({terraformRating: 40}), 'red', [{name: 'Terraformer', threshold: 35}, {name: 'Builder', threshold: 8}], ['Banker'], focus);
    const selected = menu.options[menu.initialIdx ?? -1];
    expect(titleOf(selected.title)).eq(REPLAY_TAB.milestone);
    expect((selected as any).initialIdx).eq(1);
  });

  it('builds the tabs from the state before the step', () => {
    const menu = replayActionMenu(source([]), state({awards: [{name: 'Banker', color: 'red'}]} as Partial<ReplayState>), player(),
      'red', [], ['Banker', 'Miner'], undefined);
    const titles = menu.options.map((option) => titleOf(option.title));
    expect(titles).deep.eq([REPLAY_TAB.playCard, REPLAY_TAB.award, REPLAY_TAB.standardProjects, REPLAY_TAB.pass, REPLAY_TAB.sell]);
    // Second award costs 14
    expect((menu.options[1].title as any).data[0].value).eq('14');
    expect(titles[menu.initialIdx ?? -1]).eq(REPLAY_TAB.playCard);
  });

  const titlesOf = (menu: ReturnType<typeof replayActionMenu>) => menu.options.map((option) => titleOf(option.title));
  const milestones = [{name: 'Terraformer', threshold: 35}, {name: 'Mayor', threshold: 3}, {name: 'Builder', threshold: 8}];

  it('offers milestones only while fewer than three are claimed, with 8 M€ and the target reached', () => {
    const claimed = state({milestones: [{name: 'Mayor', color: 'red'}, {name: 'Builder', color: 'blue'}, {name: 'Gardener', color: 'red'}]} as Partial<ReplayState>);
    expect(titlesOf(replayActionMenu(source([]), claimed, player({terraformRating: 40}), 'red', milestones, [], undefined))).not.contains(REPLAY_TAB.milestone);
    const open = replayActionMenu(source([]), state(), player({terraformRating: 40}), 'red', milestones, [], undefined);
    expect((open.options[0] as any).options.map((entry: any) => entry.title)).deep.eq(['Terraformer']);
    expect(titlesOf(replayActionMenu(source([]), state(), player({terraformRating: 20}), 'red', milestones, [], undefined))).not.contains(REPLAY_TAB.milestone);
    expect(titlesOf(replayActionMenu(source([]), state(), player({terraformRating: 40, resources: [5, 0, 0, 0, 0, 0]}), 'red', milestones, [], undefined)))
      .not.contains(REPLAY_TAB.milestone);
  });

  it('offers heat and plants only with enough of them', () => {
    expect(titlesOf(replayActionMenu(source([]), state(), player(), 'red', [], [], undefined))).not.contains(REPLAY_TAB.heat);
    const rich = replayActionMenu(source([]), state(), player({resources: [30, 0, 0, 8, 0, 8]}), 'red', [], [], undefined);
    expect(titlesOf(rich)).contains(REPLAY_TAB.heat).and.contains(REPLAY_TAB.plants);
  });

  it('offers only cards the player can pay for and whose requirements are met', () => {
    // Algae needs 5 oceans, Asteroid costs 14
    const poor = replayActionMenu(source([]), state(), player({resources: [10, 0, 0, 0, 0, 0]}), 'red', [], [], undefined);
    expect(titlesOf(poor)).not.contains(REPLAY_TAB.playCard);
    const able = replayActionMenu(source([]), state({oceans: 5} as Partial<ReplayState>), player({resources: [20, 0, 0, 0, 0, 0]}), 'red', [], [], undefined);
    expect((able.options.find((option) => titleOf(option.title) === REPLAY_TAB.playCard) as any).cards.map((card: any) => card.name))
      .deep.eq([CardName.ASTEROID, CardName.ALGAE]);
    // Titanium pays for the space card
    const titanium = replayActionMenu(source([]), state(), player({resources: [5, 0, 3, 0, 0, 0]}), 'red', [], [], undefined);
    expect((titanium.options.find((option) => titleOf(option.title) === REPLAY_TAB.playCard) as any).cards.map((card: any) => card.name))
      .deep.eq([CardName.ASTEROID]);
  });

  it('offers awards only when affordable and greys out standard projects that are too expensive', () => {
    const menu = replayActionMenu(source([]), state(), player({resources: [12, 0, 0, 0, 0, 0]}), 'red', [], ['Banker'], undefined);
    expect(titlesOf(menu)).contains(REPLAY_TAB.award);
    const projects = menu.options.find((option) => titleOf(option.title) === REPLAY_TAB.standardProjects) as any;
    expect(projects.cards.filter((card: any) => card.isDisabled !== true).map((card: any) => card.name)).deep.eq([CardName.POWER_PLANT_STANDARD_PROJECT]);
    expect(titlesOf(replayActionMenu(source([]), state(), player({resources: [7, 0, 0, 0, 0, 0]}), 'red', [], ['Banker'], undefined))).not.contains(REPLAY_TAB.award);
  });

  it('ignores costs when the game played something the reconstruction could not afford', () => {
    const log = source([line('${0} played ${1}', ['red', CardName.ASTEROID])]);
    (log as any).players = [{color: 'red'}];
    const poor = state({players: [player({resources: [0, 0, 0, 0, 0, 0]})]} as Partial<ReplayState>);
    const rich = state({players: [player({resources: [20, 0, 0, 0, 0, 0]})]} as Partial<ReplayState>);
    expect(replayMoneyReliable(log, [poor], [step(0, 0)])).is.false;
    expect(replayMoneyReliable(log, [rich], [step(0, 0)])).is.true;
    const menu = replayActionMenu(source([]), state(), player({resources: [0, 0, 0, 0, 0, 0]}), 'red', [], ['Banker'], undefined, false);
    expect(titlesOf(menu)).contains(REPLAY_TAB.playCard).and.contains(REPLAY_TAB.award);
  });
});

describe('replayPlacedSpaces', () => {
  it('names each space of the step once', () => {
    const space = (value: string) => ({type: LogMessageDataType.SPACE, value} as any);
    const log = source([
      {message: '${0} placed ${1} at ${2}', data: [{type: LogMessageDataType.PLAYER, value: 'red'}, {type: LogMessageDataType.STRING, value: 'city'}, space('35')]} as ReplaySourceMessage,
      {message: '${0} gained ${1} at ${2}', data: [space('35')]} as ReplaySourceMessage,
      line('${0} played ${1}', ['red', CardName.ASTEROID]),
    ]);
    expect(replayPlacedSpaces(log, step(0, 1))).deep.eq(['35']);
  });
});

describe('replayAddress', () => {
  it('reads and writes the perspective of the replay address', () => {
    window.history.replaceState(null, '', '/replay?id=g1');
    expect(readReplayPlayer(['red', 'blue'])).is.undefined;
    writeReplayPlayer('blue');
    expect(window.location.search).eq('?id=g1&player=blue');
    expect(readReplayPlayer(['red', 'blue'])).eq('blue');
    expect(readReplayPlayer(['red'])).is.undefined;
    writeReplayPlayer(undefined);
    expect(window.location.search).eq('?id=g1');
  });
});
