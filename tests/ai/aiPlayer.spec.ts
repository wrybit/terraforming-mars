import {expect} from 'chai';
import {clearPlayerTunings, setPlayerTuning} from '../../src/server/ai/aiTuning';
import {Player} from '../../src/server/Player';
import {Database} from '../../src/server/database/Database';
import {runInSandbox, isSimulating} from '../../src/server/ai/simulationSandbox';
import {chooseResponse} from '../../src/server/ai/chooseResponse';
import {aiPlayerName} from '../../src/common/ai/AiLevel';
import {playRandomGame} from '../simulation/playRandomGame';
import {testGame} from '../TestGame';
import {Server} from '../../src/server/models/ServerModel';
import {SelectOption} from '../../src/server/inputs/SelectOption';

describe('AI player', () => {
  it('keeps its level through serialization', () => {
    const [game, player] = testGame(2);
    player.aiLevel = 'hard';
    const restored = Player.deserialize(JSON.parse(JSON.stringify(player.serialize())));
    expect(restored.aiLevel).eq('hard');
    expect(game.players[1].aiLevel).is.undefined;
  });

  it('hides the input of an AI player from its page, so viewers just watch', () => {
    const [/* game */, human, ai] = testGame(2);
    ai.aiLevel = 'normal';
    human.setWaitingFor(new SelectOption('test'));
    expect(Server.getPlayerModel(human).waitingFor).is.not.undefined;
    // Assigned directly: setWaitingFor would make the AI answer right away
    (ai as any).waitingFor = new SelectOption('test');
    expect(Server.getPlayerModel(ai).waitingFor).is.undefined;
  });

  it('marks AI names with their level', () => {
    expect(aiPlayerName('Claude', 'normal')).eq('Claude [AI]');
    expect(aiPlayerName('Green (AI)', 'easy')).eq('Green [AI-]');
    expect(aiPlayerName('Rot [AI]', 'hard')).eq('Rot [AI+]');
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
      // Without rollouts: they take seconds per action, the whole game would exceed the timeout.
      responders: [(input, player) => {
        setPlayerTuning(player.id, 'noRollout');
        return chooseResponse(input, player, 'normal');
      }, undefined],
    });
    clearPlayerTunings();
    expect(result.finished).is.true;
    expect(result.victoryPoints[0]).greaterThan(result.victoryPoints[1]);
  }).timeout(60000);
});
