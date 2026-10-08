import {Expansion, MODULE_NAMES} from '../cards/GameModule';

// Which game settings the AI players can handle. Shared by the create-game form (switches the AI
// off and names the reason) and the server (refuses AI players otherwise), so both always agree.

/** Expansions the AI has been built and tested for. */
export const AI_SUPPORTED_EXPANSIONS: ReadonlyArray<Expansion> = ['corpera', 'promo', 'venus', 'prelude', 'prelude2'];

export type AiSupportSettings = {
  expansions: Partial<Record<Expansion, boolean>>,
  /** Merger: two corporations per player – the AI only picks one. */
  twoCorpsVariant?: boolean,
};

/** Names of the settings that rule out AI players (English, translated in the client); empty = AI possible. */
export function aiUnsupportedReasons(settings: AiSupportSettings): Array<string> {
  const reasons: Array<string> = [];
  for (const [expansion, enabled] of Object.entries(settings.expansions) as Array<[Expansion, boolean | undefined]>) {
    if (enabled === true && !AI_SUPPORTED_EXPANSIONS.includes(expansion)) {
      reasons.push(MODULE_NAMES[expansion]);
    }
  }
  if (settings.twoCorpsVariant === true) {
    reasons.push('Merger');
  }
  return reasons;
}
