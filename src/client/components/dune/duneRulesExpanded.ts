import {reactive} from 'vue';

// Which rule lists of the Dune modules the player opened (DuneRuleCards.vue), by the text of their first rule. Only in
// memory: a reload of the page folds all rules away again (Jens, 19 Oct 2026).
export const expandedRules: Set<string> = reactive(new Set<string>());
