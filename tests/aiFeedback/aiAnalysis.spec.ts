import {expect} from 'chai';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {testGame} from '../TestGame';
import {TestPlayer} from '../TestPlayer';
import {IGame} from '../../src/server/IGame';
import {GameLogs} from '../../src/server/routes/GameLogs';
import {LogHelper} from '../../src/server/LogHelper';
import {runWithAiDecision} from '../../src/server/logs/aiDecisionContext';
import {AiFeedbackStore} from '../../src/server/aiFeedback/AiFeedbackStore';
import {aiPlayerOfLine} from '../../src/server/aiFeedback/aiLogLines';
import {AiDecisionSummary} from '../../src/common/ai/AiDecisionSummary';
import {summaryOf} from '../../src/server/ai/decisionTrace';
import {finishGeneration} from '../TestingUtils';
import {cast} from '../../src/common/utils/utils';
import {SelectCard} from '../../src/server/inputs/SelectCard';
import {IProjectCard} from '../../src/server/cards/IProjectCard';
import {OrOptions} from '../../src/server/inputs/OrOptions';
import {SelectOption} from '../../src/server/inputs/SelectOption';
import {possibleActionsOf} from '../../src/server/ai/possibleActions';
import {Algae} from '../../src/server/cards/base/Algae';
import {Ants} from '../../src/server/cards/base/Ants';

function analysisGame(): [IGame, TestPlayer, TestPlayer] {
  const [game, human, ai] = testGame(2, {aiAnalysis: true});
  ai.aiLevel = 'hard';
  return [game, human, ai];
}

const summary: AiDecisionSummary = {id: 'g1:1', kind: 'action', title: 'Take your next action', saveId: 3, generation: 1, options: [{index: 0, label: 'Algae', card: 'Algae', value: 3, chosen: true}]};

describe('AI analysis games', () => {
  it('gives every line an id only in analysis games', () => {
    const [plain] = testGame(2);
    plain.log('test line');
    expect(plain.gameLog[plain.gameLog.length - 1].id).is.undefined;

    const [game] = analysisGame();
    game.log('test line');
    expect(game.gameLog[game.gameLog.length - 1].id).is.a('string');
  });

  it('names AI players in their private lines, humans read "You"', () => {
    const [game, human, ai] = analysisGame();
    LogHelper.logPrivately(human, 'You bought no cards', '${0} bought no cards', () => {});
    LogHelper.logPrivately(ai, 'You bought no cards', '${0} bought no cards', () => {});
    const [humanLine, aiLine] = game.gameLog.slice(-2);
    expect(humanLine.message).eq('You bought no cards');
    expect(humanLine.playerId).eq(human.id);
    expect(aiLine.message).eq('${0} bought no cards');
    expect(aiLine.data[0].value).eq(ai.color);
    expect(aiLine.playerId).eq(ai.id);
  });

  it('shares private lines of AI players, never those of humans or the AI id', () => {
    const [game, human, ai] = analysisGame();
    const other = new TestPlayer('blue');
    LogHelper.logPrivately(ai, 'You bought no cards', '${0} bought no cards', () => {});
    game.log('secret of the human', () => {}, {reservedFor: human});
    const lines = new GameLogs().getLogsForGameView(other.id, game, undefined);
    const aiLine = lines.find((line) => line.message === '${0} bought no cards');
    expect(aiLine?.aiInsight).eq(ai.color);
    expect(aiLine?.playerId).is.undefined;
    expect(JSON.stringify(lines)).not.include(ai.id);
    expect(lines.some((line) => line.message === 'secret of the human')).is.false;
  });

  it('keeps AI lines private outside analysis games', () => {
    const [game, human, ai] = testGame(2);
    ai.aiLevel = 'hard';
    LogHelper.logPrivately(ai, 'You bought no cards', '${0} bought no cards', () => {});
    const lines = new GameLogs().getLogsForGameView(human.id, game, undefined);
    expect(lines.some((line) => line.message === '${0} bought no cards')).is.false;
  });

  it('links the lines of an AI move to its decision, options only on the first', () => {
    const [game, human, ai] = analysisGame();
    runWithAiDecision(ai, summary, () => {
      game.log('${0} played ${1}', (b) => b.player(ai).string('x'));
      game.log('${0} gained ${1}', (b) => b.player(human).number(1));
      game.log('${0} gained ${1}', (b) => b.player(ai).number(2));
    });
    const [played, other, gained] = game.gameLog.slice(-3);
    expect(played.aiDecision?.id).eq('g1:1');
    expect(other.aiDecisionId).is.undefined;
    expect(gained.aiDecisionId).eq('g1:1');
    expect(gained.aiDecision).is.undefined;
  });

  it('keeps a draft decision until the pick is logged', () => {
    const [game, , ai] = analysisGame();
    runWithAiDecision(ai, {...summary, kind: 'draft'}, () => {});
    LogHelper.logPrivately(ai, 'You drafted ${0}', '${0} drafted ${1}', (b) => b.string('Algae'));
    expect(game.gameLog[game.gameLog.length - 1].aiDecision?.kind).eq('draft');
  });

  it('finds the AI player of a line', () => {
    const [game, human, ai] = analysisGame();
    game.log('${0} passed', (b) => b.player(ai));
    expect(aiPlayerOfLine(game, game.gameLog[game.gameLog.length - 1])).eq(ai);
    game.log('${0} passed', (b) => b.player(human));
    expect(aiPlayerOfLine(game, game.gameLog[game.gameLog.length - 1])).is.undefined;
  });

  it('summarises the best options plus every chosen one', () => {
    const options = Array.from({length: 12}, (_, index) => ({label: 'o' + index, value: 12 - index, chosen: index === 11}));
    const shown = summaryOf('g1:2', 'space', 'title', options, 0, 1).options;
    expect(shown.length).eq(11);
    expect(shown[shown.length - 1].label).eq('o11');
  });

  it('appends ratings; per decision and rater the last line counts, retracted ones vanish', () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-feedback-'));
    const store = new AiFeedbackStore(directory);
    const base = {gameId: 'g1', decisionId: 'g1:4', messageId: '7.a', saveId: 12, generation: 2,
      rater: {playerId: 'p-red', color: 'red' as const, name: 'Red', role: 'opponent' as const}, text: '', at: 1};
    store.append({...base, rating: 'up'});
    store.append({...base, rating: 'down', text: 'too greedy', at: 2});
    const reloaded = new AiFeedbackStore(directory);
    expect(reloaded.records('g1')).has.length(2);
    expect(reloaded.entries('g1').map((entry) => entry.rating)).deep.eq(['down']);
    expect(JSON.stringify(reloaded.entries('g1'))).not.include('p-red');
    store.append({...base, retracted: true, at: 3});
    expect(new AiFeedbackStore(directory).entries('g1')).deep.eq([]);
    fs.rmSync(directory, {recursive: true, force: true});
  });

  it('logs each draft pick privately once the table has picked', () => {
    const [game, player, otherPlayer] = testGame(2, {draftVariant: true, skipInitialShuffling: true});
    game.generation = 1;
    finishGeneration(game);
    for (const drafter of [player, otherPlayer]) {
      const input = cast(drafter.popWaitingFor(), SelectCard<IProjectCard>);
      input.process({type: 'card', cards: [input.cards[0].name]});
    }
    const picks = game.gameLog.filter((line) => line.message === 'You drafted ${0}, passing ${1} to ${2}');
    expect(picks.map((line) => line.playerId)).has.members([player.id, otherPlayer.id]);
    expect(picks[0].data[1].value).has.length(3);
  });

  it('lists what the action menu offered, with the selectable cards', () => {
    const menu = new OrOptions(
      new SelectCard('Play project card', 'Play', [new Algae(), new Ants()], {enabled: [true, false]}),
      new SelectOption('Pass for this generation'),
    );
    expect(possibleActionsOf(menu)).deep.eq([
      {title: 'Play project card', cards: ['Algae']},
      {title: 'Pass for this generation'},
    ]);
  });
});
