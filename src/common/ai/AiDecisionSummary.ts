// What the log of an analysis game shows about one AI decision: the options the AI weighed,
// their values and the choice. A compact copy of the decision trace (server/ai/decisionTrace.ts).

export type AiDecisionOption = {
  /** Readable option, e.g. a card name or "Standard projects: City". */
  label: string,
  /** Set when the option is a single card: the client shows its translated name. */
  card?: string,
  /** Group of the initial selection: corporation, prelude or project card. */
  group?: 'corporation' | 'prelude' | 'project',
  /** Value the AI gave the option, in M€ of position value (higher = better). */
  value?: number,
  chosen?: boolean,
};

export type AiDecisionSummary = {
  /** Same id as in the decision log file (<gameId>.jsonl) and in ratings. */
  id: string,
  /** initial, draft, research, action, space or other. */
  kind: string,
  /** Question the AI answered (player input title, English key). */
  title: string,
  options: Array<AiDecisionOption>,
};

/** Most options a log line carries; the decision log file keeps all of them. */
export const MAX_SUMMARY_OPTIONS = 8;
