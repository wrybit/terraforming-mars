import * as responses from '../server/responses';
import {Handler} from '../routes/Handler';
import {Context} from '../routes/IHandler';
import {Request} from '../Request';
import {Response} from '../Response';
import {RouteError} from '../routes/RouteError';
import {readBody} from '../routes/readBody';
import {FEEDBACK_LIMITS} from '../../common/feedback/FeedbackReport';
import {parseFeedbackReport} from './parseFeedbackReport';
import {feedbackDelivery, feedbackEnabled} from './feedbackSettings';

/**
 * Receives a report of the overlay when an extension delivers it on the server (e.g. by mail). Without one, reports
 * never reach the server: they become a GitHub issue in the tester's browser.
 */
export class ApiFeedback extends Handler {
  public static readonly INSTANCE = new ApiFeedback();
  private constructor() {
    super();
  }

  public override async post(req: Request, res: Response, ctx: Context): Promise<void> {
    const deliver = feedbackDelivery();
    if (!feedbackEnabled() || deliver === undefined) {
      throw RouteError.notFound('Feedback is not delivered by this server.');
    }
    const report = parseFeedbackReport(await readBody(req, FEEDBACK_LIMITS.requestBytes));
    responses.writeJson(res, ctx, await deliver(report, ctx.ip));
  }
}
