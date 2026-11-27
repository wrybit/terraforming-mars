// Server part of an optional extension (see src/common/extensions/CommonExtension.ts).
import {IHandler} from '../routes/IHandler';
import {FeedbackReport, FeedbackResult} from '../../common/feedback/FeedbackReport';

/** Delivers a checked report of the feedback overlay on the server (e.g. stores and mails it) */
export type FeedbackDelivery = (report: FeedbackReport, ip: string) => Promise<FeedbackResult>;

export type ServerExtension = {
  name: string,
  /** Extra routes: path (as in paths.ts, without leading slash) → handler */
  routes?: ReadonlyArray<readonly [string, IHandler]>,
  /** Feedback goes to the server instead of a GitHub issue (Admin → Settings → Feedback) */
  feedbackDelivery?: FeedbackDelivery,
};
