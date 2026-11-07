import {expect} from 'chai';
import {testGame} from '../TestGame';
import {setOxygenLevel, setTemperature} from '../TestingUtils';
import {lobbyGameTimeline} from '../../src/server/lobby/lobbyGameTimeline';
import {LogMessage} from '../../src/common/logs/LogMessage';
import {LogMessageType} from '../../src/common/logs/LogMessageType';
import {LogMessageDataType} from '../../src/common/logs/LogMessageDataType';
import {GlobalParameter} from '../../src/common/GlobalParameter';

// Log lines as the game writes them, with a chosen time
function line(timestamp: number, message: string, data: LogMessage['data']): LogMessage {
  const log = new LogMessage(LogMessageType.DEFAULT, message, data);
  log.timestamp = timestamp;
  return log;
}

describe('lobbyGameTimeline', () => {
  it('measures each generation and counts its steps', () => {
    const [game, player] = testGame(2);
    game.gameLog.length = 0;
    game.gameLog.push(
      line(1_000, 'Generation ${0}', [{type: LogMessageDataType.RAW_STRING, value: '1'}]),
      line(301_000, 'Generation ${0}', [{type: LogMessageDataType.RAW_STRING, value: '2'}]),
      line(350_000, '${0} claimed ${1} milestone', [{type: LogMessageDataType.PLAYER, value: player.color}, {type: LogMessageDataType.MILESTONE, value: 'Terraformer'}]),
    );
    game.generation = 2;
    // End of generation 1: +2 temperature steps, +1 oxygen
    game.globalsPerGeneration = [{[GlobalParameter.TEMPERATURE]: -26, [GlobalParameter.OXYGEN]: 1, [GlobalParameter.OCEANS]: 0}];
    // Running generation 2: +1 temperature step on top
    setTemperature(game, -24);
    setOxygenLevel(game, 1);

    const timeline = lobbyGameTimeline(game, 401_000);

    expect(timeline.generations).deep.eq([
      {number: 1, durationMs: 300_000, steps: {temperature: 2, oxygen: 1}},
      {number: 2, durationMs: 100_000, steps: {temperature: 1}},
    ]);
    expect(timeline.marks).deep.eq([{kind: 'milestone', name: 'Terraformer', player: player.name, color: player.color, generation: 2, atMs: 349_000}]);
    expect(timeline.remainingMs).greaterThan(0);
  });

  it('copes with games without generation lines', () => {
    const [game] = testGame(2);
    game.gameLog.length = 0;
    const timeline = lobbyGameTimeline(game, Date.now());
    expect(timeline.generations).has.length(1);
    expect(timeline.marks).deep.eq([]);
  });
});
