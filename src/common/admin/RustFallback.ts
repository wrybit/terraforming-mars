/** One decision of the Rust AI that the TypeScript AI made instead (crash, no answer in time, refused answer). */
export type RustFallback = {
  timeMs: number;
  gameId: string;
  generation: number;
  /** Kind of the decision, e.g. "or: Take your first action" */
  decision: string;
  reason: string;
};

/** Rust AI fallbacks on the admin dashboard. */
export type RustFallbackSummary = {
  /** Fallbacks in the last 24 hours */
  last24h: number;
  /** Newest first, at most a few */
  recent: Array<RustFallback>;
};
