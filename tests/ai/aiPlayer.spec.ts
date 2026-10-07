import {expect} from 'chai';
import {Player} from '../../src/server/Player';
import {Database} from '../../src/server/database/Database';
import {runInSandbox, isSimulating} from '../../src/server/ai/simulationSandbox';
import {chooseResponse} from '../../src/server/ai/chooseResponse';
import {playRandomGame} from '../simulation/playRandomGame';
import {testGame} from '../TestGame';

describe('AI player', () => {
  it('keeps its level through serialization', () => {
    const [game, player] = testGame(2);
    player.aiLevel = 'hard';
    const restored = Player.deserialize(JSON.parse(JSON.stringify(player.serialize())));
    expect(restored.aiLevel).eq('hard');
    expect(game.players[1].aiLevel).is.undefined;
  });

  it('sandbox swaps the database and restores it', () => {
    const database = Database.getInstance();
    runInSandbox(() => {
      expect(isSimulating()).is.true;
      expect(Database.getInstance()).not.eq(database);
    });
    expect(isSimulating()).is.false;
    expect(Database.getInstance()).eq(database);
  });

  it('plays a complete game and beats a random player', () => {
    const result = playRandomGame({
      playerCount: 2,
      gameOptions: {},
      maximumGenerations: 30,
      maximumDecisions: 20000,
      maximumAttemptsPerDecision: 200,
      random: Math.random,
      responders: [(input, player) => chooseResponse(input, player, 'normal'), undefined],
    });
    expect(result.finished).is.true;
    expect(result.victoryPoints[0]).greaterThan(result.victoryPoints[1]);
  }).timeout(60000);
});
