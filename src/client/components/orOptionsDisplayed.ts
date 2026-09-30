import {OrOptionsModel} from '@/common/models/PlayerInputModel';
import {getPreferences} from '@/client/utils/PreferencesManager';

/*
 * Indizes der Optionen eines Aktionsmenüs, die angezeigt werden (in Server-Reihenfolge).
 *
 * Karten-Optionen, die nur im Lernmodus erscheinen sollen, entfallen ohne Lernmodus. Gemeinsam genutzt von
 * OrOptions (Tabs) und dem Zug-Menü der Mobil-Ansicht, damit beide dieselben Einträge zeigen.
 */
export function displayedOptionIndices(input: OrOptionsModel): Array<number> {
  const learnerMode = getPreferences().learner_mode;
  return input.options
    .map((option, index) => ({option, index}))
    .filter(({option}) => !(option.type === 'card' && option.showOnlyInLearnerMode !== false && !learnerMode))
    .map(({index}) => index);
}
