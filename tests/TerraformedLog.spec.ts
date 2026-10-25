import {expect} from 'chai';
import {testGame} from './TestGame';
import {maxOutOceans, setOxygenLevel, setTemperature} from './TestingUtils';
import {Game} from '../src/server/Game';
import {MAX_OXYGEN_LEVEL, MAX_TEMPERATURE} from '../src/common/constants';

describe('Terraformed log line', () => {
  const terraformedLines = (game: Game) => game.gameLog.filter((message) => message.message === 'Mars is terraformed');

  it('is written once, when the last global parameter is reached', () => {
    const [game, player] = testGame(2);
    maxOutOceans(player);
    setOxygenLevel(game, MAX_OXYGEN_LEVEL);
    setTemperature(game, MAX_TEMPERATURE - 2);
    expect(terraformedLines(game as Game)).is.empty;
    game.increaseTemperature(player, 1);
    expect(terraformedLines(game as Game)).has.length(1);
    // Later parameter calls (already maxed) don't repeat it, neither does a reload
    game.increaseOxygenLevel(player, 1);
    const restored = Game.deserialize(JSON.parse(JSON.stringify(game.serialize())));
    restored.increaseTemperature(player, 1);
    expect(terraformedLines(restored)).has.length(1);
  });

  it('is not written late for games saved before the line existed', () => {
    const [game, player] = testGame(2);
    maxOutOceans(player);
    setOxygenLevel(game, MAX_OXYGEN_LEVEL);
    setTemperature(game, MAX_TEMPERATURE);
    const serialized = JSON.parse(JSON.stringify(game.serialize()));
    delete serialized.terraformedLogged;
    const restored = Game.deserialize(serialized);
    restored.increaseTemperature(restored.players[0], 1);
    expect(terraformedLines(restored)).is.empty;
  });
});
