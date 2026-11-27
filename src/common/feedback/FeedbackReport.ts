// Contract between the feedback overlay (client) and api/feedback (server): what is sent and what comes back.

export type FeedbackMarkerKind = 'pin' | 'area';

/** One numbered marker; its position is drawn into the screenshot, the text travels here. */
export type FeedbackMarker = {
  kind: FeedbackMarkerKind,
  number: number,
  text: string,
};

/** One line of the technical details (browser, viewport, commit …), already labeled for the mail. */
export type FeedbackDiagnostic = {
  label: string,
  value: string,
};

export type FeedbackReport = {
  name: string,
  email: string,
  discord: string,
  general: string,
  markers: ReadonlyArray<FeedbackMarker>,
  /** JPEG as data URL (data:image/jpeg;base64,…), markers already drawn in; empty when the capture failed */
  screenshot: string,
  diagnostics: ReadonlyArray<FeedbackDiagnostic>,
};

/** sent: delivered by the server (an extension, e.g. by mail); tooMany: rate limit; failed: not delivered */
export type FeedbackResult = {
  status: 'sent' | 'tooMany' | 'failed',
};

export const FEEDBACK_LIMITS = {
  /** Whole request; the screenshot is scaled down until it fits */
  requestBytes: 1_000_000,
  contactLength: 200,
  textLength: 5000,
  markers: 50,
  diagnostics: 40,
} as const;
