import {OrOptionsModel} from '@/common/models/PlayerInputModel';
import {getPreferences} from '@/client/utils/PreferencesManager';
import {isSkipOption} from '@/client/components/skipOption';
import {DUNE_ACTIONS_TITLE} from '@/common/dune/duneActionTitles';

/*
 * Indices of an action menu's options that are displayed – in server order, only "do nothing"
 * (skipOption.ts) always at the end, so it doesn't sit between the real choices.
 *
 * Card options that should only appear in learning mode are dropped without learning mode. Shared by
 * OrOptions (tabs) and the mobile view's turn menu, so both show the same entries.
 *
 * The moves of the Dune modules are made in their module tabs at the board (dune/DuneMovePanel.vue), so their group
 * is no entry of the menu.
 */
export function displayedOptionIndices(input: OrOptionsModel): Array<number> {
  const learnerMode = getPreferences().learner_mode;
  return input.options
    .map((option, index) => ({option, index}))
    .filter(({option}) => !(option.type === 'card' && option.showOnlyInLearnerMode !== false && !learnerMode))
    .filter(({option}) => option.title !== DUNE_ACTIONS_TITLE)
    // sort is stable: the remaining order is preserved
    .sort((first, second) => Number(isSkipOption(first.option)) - Number(isSkipOption(second.option)))
    .map(({index}) => index);
}
