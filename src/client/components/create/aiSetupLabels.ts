import {AiSetupLimit} from '@/common/ai/aiSetupLimits';

/** Name of a setup the Rust AI cannot play, as the row or chip of the create form calls it. */
export type AiSetupLabel = {label: string, iconClass?: string};

// Same labels as the card pool chips and option rows (CreateGameForm.vue), so a reason chip points at its row
export const AI_SETUP_LABELS: Record<AiSetupLimit, AiSetupLabel> = {
  noCorporateEra: {label: 'Without Corporate Era', iconClass: 'expansion-icon-CE'},
  customCorporations: {label: 'Custom Corporation list'},
  customPreludes: {label: 'Custom Preludes list', iconClass: 'expansion-icon-prelude'},
  customCeos: {label: 'Custom CEOs list', iconClass: 'expansion-icon-ceo'},
  customColonies: {label: 'Custom Colonies list', iconClass: 'expansion-icon-colony'},
  bannedCards: {label: 'Exclude some cards'},
  includedCards: {label: 'Include some cards'},
  manualMilestones: {label: 'Manual Milestones & Awards'},
  escapeVelocity: {label: 'Escape Velocity', iconClass: 'expansion-icon-escape-velocity'},
  predefinedGame: {label: 'Set Predefined Game'},
};
