// Routes of the feedback (Admin → Settings → Feedback). Without an extension that delivers reports on the server
// the overlay hands them to GitHub in the tester's own browser (feedbackIssue.ts), so only the config is asked.
export const FEEDBACK_PATHS = {
  send: 'api/feedback',
  config: 'api/feedback/config',
} as const;

/** Answer of FEEDBACK_PATHS.config */
export type FeedbackConfig = {
  /** Admin setting FEEDBACK: the overlay, its menu entry, key and shaking exist only then */
  enabled: boolean,
  /** An extension delivers reports on the server (e.g. by mail); otherwise they become a GitHub issue */
  serverDelivery: boolean,
};

export const FEEDBACK_DISABLED: FeedbackConfig = {enabled: false, serverDelivery: false};
