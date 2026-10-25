import {MAX_SUSPICION} from '@/common/dune/DuneModel';

// Envy of the great houses (CHOAM): the steps of the track with their names from the story (Jens 24 Oct 2026: concord
// … ostracism). Shared by the track (SmugglingPanel.vue) and the tribute pane (ChoamExchangeInput.vue).

export const ENVY_LEVELS: ReadonlyArray<number> = Array.from({length: MAX_SUSPICION + 1}, (_, level) => level);

/** English names, translated on display */
export const ENVY_LEVEL_NAMES: ReadonlyArray<string> = ['Concord', 'Whispers', 'Distrust', 'Grudge', 'Enmity', 'Ostracism'];
