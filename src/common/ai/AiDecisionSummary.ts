// What the log of an analysis game shows about one AI decision: the options the AI weighed,
// their values and the choice. A compact copy of the decision trace (server/ai/decisionTrace.ts).

export type AiDecisionOption = {
  /** Position in the AI's traced options (decision log file); a rating's "better would be" refers to it. */
  index?: number,
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

/** One entry of the action menu at a decision: its title (English key with parameters) and the cards it offered. */
export type AiPossibleAction = {
  title: string,
  params?: Array<string>,
  cards?: Array<string>,
};

/** The AI's situation when it decided: what a human would want to see next to a pass or a purchase. */
export type AiDecisionState = {
  megaCredits: number, steel: number, titanium: number, plants: number, energy: number, heat: number,
  production: {megacredits: number, steel: number, titanium: number, plants: number, energy: number, heat: number},
  terraformRating: number,
  victoryPoints: number,
  /** Card names on hand (analysis games open the AI's hand anyway). */
  hand: Array<string>,
  /** Action decisions: everything the menu offered (shows what a pass left out). */
  possibleActions?: Array<AiPossibleAction>,
};

export type AiDecisionSummary = {
  /** "<gameId>:<n>", the same id as in the decision log file (<gameId>.jsonl) and in ratings. */
  id: string,
  /** Save before the decision: the game state it was made in (game.db / exported saves). */
  saveId: number,
  generation: number,
  /** initial, draft, research, action, space or other. */
  kind: string,
  /** Question the AI answered (player input title, English key). */
  title: string,
  options: Array<AiDecisionOption>,
  /** Situation of the AI at the decision. */
  state?: AiDecisionState,
};

/** Most options a log line carries (actions: all, a pass must show everything still possible); the decision log file keeps all of them. */
export const MAX_SUMMARY_OPTIONS = 10;
