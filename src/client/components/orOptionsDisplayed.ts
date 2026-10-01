import {OrOptionsModel} from '@/common/models/PlayerInputModel';
import {getPreferences} from '@/client/utils/PreferencesManager';
import {isSkipOption} from '@/client/components/skipOption';

/*
 * Indizes der Optionen eines Aktionsmenüs, die angezeigt werden – in Server-Reihenfolge, nur "nichts tun"
 * (skipOption.ts) immer ans Ende, damit es nicht zwischen den echten Wahlmöglichkeiten steht.
 *
 * Karten-Optionen, die nur im Lernmodus erscheinen sollen, entfallen ohne Lernmodus. Gemeinsam genutzt von
 * OrOptions (Tabs) und dem Zug-Menü der Mobil-Ansicht, damit beide dieselben Einträge zeigen.
 */
export function displayedOptionIndices(input: OrOptionsModel): Array<number> {
  const learnerMode = getPreferences().learner_mode;
  return input.options
    .map((option, index) => ({option, index}))
    .filter(({option}) => !(option.type === 'card' && option.showOnlyInLearnerMode !== false && !learnerMode))
    // sort ist stabil: die übrige Reihenfolge bleibt erhalten
    .sort((first, second) => Number(isSkipOption(first.option)) - Number(isSkipOption(second.option)))
    .map(({index}) => index);
}
