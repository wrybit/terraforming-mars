// Choice in the trade / build-colony tab, shown on the Colonies board as a preview
// (marker drops back, who gets the colony bonus, own cube on the next free slot).
import {reactive} from 'vue';
import {ColonyName} from '@/common/colonies/ColonyName';

export type ColonyPreviewMode = 'trade' | 'build';

export const colonyTradeState = reactive({
  mode: undefined as ColonyPreviewMode | undefined,
  pick: undefined as ColonyName | undefined,
});

export function setColonyPreview(mode: ColonyPreviewMode | undefined, pick?: ColonyName): void {
  colonyTradeState.mode = mode;
  colonyTradeState.pick = pick;
}
