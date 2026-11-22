import {RustAiOption} from '@/common/ai/RustAiSupport';

/** Name of an option row in the create form; icon as in its row or its expansion's options. */
export type RustAiOptionLabel = {label: string, iconClass?: string};

// Same labels as the option rows (CreateGameForm.vue), so a reason chip reads like the row it points to
export const RUST_AI_OPTION_LABELS: Record<RustAiOption, RustAiOptionLabel> = {
  draftVariant: {label: 'Draft variant'},
  initialDraftVariant: {label: 'Initial Draft variant'},
  preludeDraftVariant: {label: 'Prelude Draft', iconClass: 'expansion-icon-prelude'},
  ceosDraftVariant: {label: 'CEO Draft', iconClass: 'expansion-icon-ceo'},
  twoCorpsVariant: {label: 'Merger', iconClass: 'expansion-icon-prelude'},
  solarPhaseOption: {label: 'World Government Terraforming'},
  soloTR: {label: '63 TR solo mode'},
  shuffleMapOption: {label: 'Randomize board tiles'},
  modularMA: {label: 'Official Random α'},
  includeFanMA: {label: 'Include fan Milestones/Awards'},
  altVenusBoard: {label: 'Alt. Venus Board', iconClass: 'expansion-icon-venus'},
  requiresVenusTrackCompletion: {label: 'Mandatory Venus Terraforming', iconClass: 'expansion-icon-venus'},
  removeNegativeGlobalEventsOption: {label: 'Remove negative Global Events', iconClass: 'expansion-icon-turmoil'},
  requiresMoonTrackCompletion: {label: 'Mandatory Moon Terraforming', iconClass: 'expansion-icon-themoon'},
  moonStandardProjectVariant: {label: 'Standard Project Variant #2', iconClass: 'expansion-icon-themoon'},
  moonStandardProjectVariant1: {label: 'Standard Project Variant #1', iconClass: 'expansion-icon-themoon'},
  aresExtremeVariant: {label: 'Extreme', iconClass: 'expansion-icon-ares'},
};
