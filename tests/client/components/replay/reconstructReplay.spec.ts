import {expect} from 'chai';
import {reconstructReplay} from '@/client/components/replay/reconstructReplay';
import {ReplaySourceMessage, ReplaySourceModel, ReplaySourcePlayer} from '@/common/models/ReplaySourceModel';
import {LogMessageDataType} from '@/common/logs/LogMessageDataType';
import {LogMessageType} from '@/common/logs/LogMessageType';
import {CardName} from '@/common/cards/CardName';
import {TileType} from '@/common/TileType';
import {SpaceId} from '@/common/Types';

const player = (color: 'red' | 'blue', overrides: Partial<ReplaySourcePlayer> = {}): ReplaySourcePlayer => ({
  color, name: color, startTerraformRating: 20, dealtProjectCards: [],
  endResources: {megacredits: 0, steel: 0, titanium: 0, plants: 0, energy: 0, heat: 0},
  endHand: [], ...overrides,
});
const line = (message: string, values: Array<string | Array<string>>, extra: Partial<ReplaySourceMessage> = {}): ReplaySourceMessage => ({
  message, data: values.map((value) => ({type: LogMessageDataType.STRING, value} as any)), ...extra,
});
const source = (log: Array<ReplaySourceMessage>, players = [player('red'), player('blue')]): ReplaySourceModel => ({
  players, startTemperature: -30, startOxygenLevel: 0, endTiles: [], log,
});
// The last state is set to the known end: tests look at the one before
const beforeEnd = (log: Array<ReplaySourceMessage>, players?: Array<ReplaySourcePlayer>) => {
  const states = reconstructReplay(source([...log, line('${0} passed', ['blue'])], players));
  return states[states.length - 2];
};

describe('reconstructReplay', () => {
  it('starts with the corporation money and pays a played card', () => {
    const state = beforeEnd([
      line('${0} played ${1}', ['red', CardName.CREDICOR]),
      line('${0} played ${1}', ['red', CardName.ASTEROID]),
    ]);
    // CrediCor 57 M€, Asteroid costs 14 and raises the temperature 1 step
    expect(state.players[0].resources[0]).eq(57 - 14);
    expect(state.temperature).eq(-28);
    expect(state.players[0].terraformRating).eq(21);
    expect(state.players[0].played).deep.eq([CardName.CREDICOR, CardName.ASTEROID]);
  });

  it('places tiles and raises TR and parameters', () => {
    const state = beforeEnd([
      line('${0} ${1} ${2} at ${3}', ['red', 'placed', 'ocean tile', '15']),
      line('${0} ${1} ${2} at ${3}', ['blue', 'placed', 'greenery tile', '16']),
      line('${0} ${1} ${2} at ${3}', ['blue', 'placed', 'land claim', '17']),
    ]);
    expect(state.oceans).eq(1);
    expect(state.oxygenLevel).eq(1);
    expect(state.tiles).deep.eq([
      {space: '15' as SpaceId, tileType: TileType.OCEAN},
      {space: '16' as SpaceId, tileType: TileType.GREENERY, color: 'blue'},
    ]);
    expect(state.players.map((p) => p.terraformRating)).deep.eq([21, 21]);
  });

  it('runs the production phase at a new generation', () => {
    const state = beforeEnd([
      line('${0} gained ${1} ${2} production', ['red', '2', 'M€']),
      line('${0} gained ${1} ${2} production', ['red', '1', 'energy']),
      line('Generation ${0}', ['2'], {type: LogMessageType.NEW_GENERATION}),
    ]);
    expect(state.generation).eq(2);
    // TR 20 + 2 M€ production, energy production 1
    expect(state.players[0].resources[0]).eq(22);
    expect(state.players[0].resources[4]).eq(1);
  });

  it('builds the hand from private lines and removes played and sold cards', () => {
    const players = [player('red', {endHand: [CardName.COMET]}), player('blue')];
    const state = beforeEnd([
      line('${0} bought ${1}', ['red', [CardName.ASTEROID, CardName.COMET, CardName.MOHOLE]], {viewer: 'red'}),
      line('${0} played ${1}', ['red', CardName.ASTEROID]),
      line('${0} sold ${1} patents', ['red', '1']),
    ], players);
    expect(state.players[0].hand).deep.eq([CardName.COMET]);
    expect(state.players[0].unknownHand).eq(0);
  });

  it('keeps unnamed starting cards as unknown', () => {
    const state = beforeEnd([line('${0} kept ${1} project cards', ['red', '4'])]);
    expect(state.players[0].unknownHand).eq(4);
    expect(state.players[0].resources[0]).eq(0);
  });

  it('ends exactly with the end resources', () => {
    const players = [player('red', {endResources: {megacredits: 7, steel: 1, titanium: 0, plants: 2, energy: 0, heat: 3}}), player('blue')];
    const states = reconstructReplay(source([line('${0} passed', ['red'])], players));
    expect(states[states.length - 1].players[0].resources).deep.eq([7, 1, 0, 2, 0, 3]);
  });
});
