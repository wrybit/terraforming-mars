import {expect} from 'chai';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {testGame} from '../TestGame';
import {ApiAiFeedback} from '../../src/server/routes/ApiAiFeedback';
import {RouteTestScaffolding} from '../routes/RouteTestScaffolding';
import {MockResponse} from '../routes/HttpMocks';
import {AiFeedbackStore} from '../../src/server/aiFeedback/AiFeedbackStore';
import {installDecisionLogFile, decisionLogFileName} from '../../src/server/ai/decisionLogFile';
import {recordDecision, setDecisionRecorder, takeAiDecisionSummary, traceOptions} from '../../src/server/ai/decisionTrace';
import {runWithAiDecision} from '../../src/server/logs/aiDecisionContext';
import {SelectCard} from '../../src/server/inputs/SelectCard';
import {AiFeedbackRecord} from '../../src/common/ai/AiFeedback';
import {statusCode} from '../../src/common/http/statusCode';

// The whole chain the AI training relies on: decision → log line → rating, linked by the same decision id
describe('AI rating chain', () => {
  let directory: string;

  beforeEach(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-chain-'));
    AiFeedbackStore.replaceInstance(new AiFeedbackStore(path.join(directory, 'ai-feedback')));
    installDecisionLogFile(path.join(directory, 'decisions'));
  });

  afterEach(() => {
    setDecisionRecorder(undefined);
    AiFeedbackStore.replaceInstance(undefined);
    fs.rmSync(directory, {recursive: true, force: true});
  });

  it('links decision, log line and rating with a better option', async () => {
    const [game, human, ai] = testGame(2, {aiAnalysis: true});
    ai.aiLevel = 'hard';
    const input = new SelectCard('Select a card to keep and pass the rest to ${0}', 'Select', []);
    recordDecision(input, ai, () => {
      traceOptions('draft', [{label: 'Algae', card: 'Algae', value: 9, chosen: true}, {label: 'Ants', card: 'Ants', value: 4}]);
      return 'Algae';
    }, (choice) => choice);
    runWithAiDecision(ai, takeAiDecisionSummary(), () => {
      game.log('${0} drafted ${1}', (b) => b.player(ai).string('Algae'), {reservedFor: ai});
    });
    const line = game.gameLog[game.gameLog.length - 1];

    const scaffolding = new RouteTestScaffolding();
    await scaffolding.ctx.gameLoader.add(game);
    scaffolding.url = '/api/ai-feedback?id=' + human.id;
    const res = new MockResponse();
    const posted = scaffolding.post(ApiAiFeedback.INSTANCE, res);
    // The body arrives once the route listens (it loads the game first)
    await new Promise((resolve) => setTimeout(resolve, 20));
    scaffolding.req.emitString(JSON.stringify({messageId: line.id, rating: 'down', text: 'Ants', betterOptionIndex: 1}));
    scaffolding.req.emitter.emit('end');
    await posted;
    expect(res.statusCode).eq(statusCode.ok);

    const decision = JSON.parse(fs.readFileSync(decisionLogFileName(path.join(directory, 'decisions'), game.id), 'utf8').trim());
    const rating: AiFeedbackRecord = JSON.parse(fs.readFileSync(AiFeedbackStore.getInstance().fileOf(game.id), 'utf8').trim());
    expect(decision.decisionId).eq(`${game.id}:1`);
    expect(rating.decisionId).eq(decision.decisionId);
    expect(line.aiDecisionId).eq(decision.decisionId);
    expect(rating.saveId).is.a('number');
    expect(rating.saveId).eq(decision.saveId);
    expect(decision.playerId).eq(ai.id);
    expect(decision.aiLevel).eq('hard');
    expect(decision.options.some((option: {index: number}) => option.index === rating.betterOptionIndex)).is.true;
    expect(rating.betterOptionLabel).eq('Ants');
    expect(rating.rater.role).eq('opponent');
  });
});
