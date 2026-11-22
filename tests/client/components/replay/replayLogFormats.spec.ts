import {expect} from 'chai';
import {LogMessageDataType} from '@/common/logs/LogMessageDataType';
import {ReplaySourceMessage, ReplaySourceModel} from '@/common/models/ReplaySourceModel';
import {normalizeMessage, parsePayment} from '@/client/components/replay/replayLogFormats';
import {reconstructReplay} from '@/client/components/replay/reconstructReplay';
import {replaySteps} from '@/client/components/replay/replaySteps';
import {CardName} from '@/common/cards/CardName';

const datum = (type: LogMessageDataType, value: string) => ({type, value} as any);
const player = (color: 'red' | 'blue') => ({
  color, name: color, startTerraformRating: 20, dealtProjectCards: [],
  endResources: {megacredits: 0, steel: 0, titanium: 0, plants: 0, energy: 0, heat: 0}, endHand: [],
});
const source = (log: Array<ReplaySourceMessage>): ReplaySourceModel => ({
  players: [player('red'), player('blue')], startTemperature: -30, startOxygenLevel: 0, endTiles: [], log,
});

describe('replayLogFormats', () => {
  it('reads the payment of a played card', () => {
    expect(parsePayment('-2:r:steel: -8:r:mc:')).deep.eq([8, 2, 0, 0, 0, 0]);
    expect(parsePayment('0')).deep.eq([0, 0, 0, 0, 0, 0]);
  });

  it('translates resource and production lines into the older form', () => {
    const production = normalizeMessage({message: '${0} gained ${1}${2} because of ${3}',
      data: [datum(LogMessageDataType.PLAYER, 'red'), datum(LogMessageDataType.RAW_STRING, '2'), datum(LogMessageDataType.PRODUCTION, 'energy'), datum(LogMessageDataType.CARD, 'X')]});
    expect(production.message).eq('${0} gained ${1} ${2} production because of ${3}');
    const resource = normalizeMessage({message: '${0} lost ${1}${2}',
      data: [datum(LogMessageDataType.PLAYER, 'red'), datum(LogMessageDataType.RAW_STRING, '3'), datum(LogMessageDataType.RESOURCE, 'heat')]});
    expect(resource.message).eq('${0} lost ${1} ${2}');
  });

  it('replays a newer log: payment, production phase after the last pass, every played card a step', () => {
    const log: Array<ReplaySourceMessage> = [
      {message: '${0} played ${1}', data: [datum(LogMessageDataType.PLAYER, 'red'), datum(LogMessageDataType.CARD, CardName.CREDICOR)]},
      {message: '${0} played ${1} [ ${2} ]', data: [datum(LogMessageDataType.PLAYER, 'red'), datum(LogMessageDataType.CARD, CardName.ASTEROID), datum(LogMessageDataType.MARKDOWN, '-14:r:mc:')]},
      {message: '${0} passed', data: [datum(LogMessageDataType.PLAYER, 'red')]},
      {message: '${0} passed', data: [datum(LogMessageDataType.PLAYER, 'blue')]},
      {message: '${0} lost ${1}:i:tr:', data: [datum(LogMessageDataType.PLAYER, 'red'), datum(LogMessageDataType.RAW_STRING, '3')]},
      {message: 'Generation ${0}', data: [datum(LogMessageDataType.RAW_STRING, '2')]},
      {message: '${0} passed', data: [datum(LogMessageDataType.PLAYER, 'blue')]},
    ];
    const states = reconstructReplay(source(log));
    // 57 − 14 = 43, then production with TR 21 (Asteroid), before the vote takes 3 TR
    expect(states[3].players[0].resources[0]).eq(43 + 21);
    expect(states[4].players[0].terraformRating).eq(18);
    expect(states[5].players[0].resources[0]).eq(43 + 21);
    expect(replaySteps(source(log), states).map((step) => step.line)).deep.eq([0, 1, 2, 3, 5, 6]);
  });
});
