import {SERVER_EXTENSIONS} from '../../genfiles/extensionsServer';
import {FeedbackConfig} from '../../common/feedback/feedbackPaths';
import {FeedbackDelivery} from '../extensions/ServerExtension';

// Admin → Settings → Feedback: off unless switched on (read at every request, so it applies at once)
export function feedbackEnabled(): boolean {
  return process.env.FEEDBACK === 'true';
}

/** The extension that delivers reports on the server (e.g. by mail), if one is installed */
export function feedbackDelivery(): FeedbackDelivery | undefined {
  return SERVER_EXTENSIONS.find((extension) => extension.feedbackDelivery !== undefined)?.feedbackDelivery;
}

export function feedbackConfig(): FeedbackConfig {
  return {enabled: feedbackEnabled(), serverDelivery: feedbackEnabled() && feedbackDelivery() !== undefined};
}
