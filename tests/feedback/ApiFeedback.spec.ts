import {expect} from 'chai';
import {parseFeedbackReport} from '../../src/server/feedback/parseFeedbackReport';
import {feedbackConfig} from '../../src/server/feedback/feedbackSettings';
import {ApiFeedback} from '../../src/server/feedback/ApiFeedback';
import {MockResponse} from '../routes/HttpMocks';
import {RouteTestScaffolding} from '../routes/RouteTestScaffolding';
import {SERVER_EXTENSIONS} from '../../src/genfiles/extensionsServer';

describe('feedback routes', () => {
  afterEach(() => delete process.env.FEEDBACK);

  it('is off unless switched on', () => {
    expect(feedbackConfig().enabled).is.false;
    process.env.FEEDBACK = 'true';
    expect(feedbackConfig().enabled).is.true;
    // Without an extension that delivers, reports become GitHub issues of the testers
    expect(feedbackConfig().serverDelivery).eq(SERVER_EXTENSIONS.some((extension) => extension.feedbackDelivery !== undefined));
  });

  it('takes no reports while off', async () => {
    const scaffolding = new RouteTestScaffolding();
    const res = new MockResponse();
    scaffolding.req.method = 'POST';
    const response = scaffolding.post(ApiFeedback.INSTANCE, res);
    setImmediate(() => {
      scaffolding.req.emitString('{"general":"Hi"}');
      scaffolding.req.emitter.emit('end');
    });
    await response;
    expect(res.statusCode).eq(404);
  });

  it('rejects fields of the wrong type', () => {
    const report = {general: 'Hi', markers: [{kind: 'circle', number: 1}]};
    expect(() => parseFeedbackReport(JSON.stringify(report))).to.throw();
    expect(() => parseFeedbackReport(JSON.stringify({name: 5}))).to.throw();
    expect(() => parseFeedbackReport('no json')).to.throw();
  });

  it('accepts a report with only a text', () => {
    expect(parseFeedbackReport(JSON.stringify({general: ' Hi '}))).deep.eq({
      name: '', email: '', discord: '', general: 'Hi', markers: [], screenshot: '', diagnostics: [],
    });
  });
});
