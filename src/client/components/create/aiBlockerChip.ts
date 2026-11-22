import {AiBlocker} from '@/common/ai/aiCompatibility';
import {FAN_EXPANSIONS, OFFICIAL_EXPANSIONS} from './createGameChoices';
import {AI_OPTION_LABELS} from './aiOptionLabels';
import {boardColorClass} from './boardColorClass';
import {DuneModule} from '@/common/dune/DuneModule';
import {DUNE_MODULE_ICON, DUNE_MODULE_LABEL} from './duneModuleFields';
import {duneGraphic} from '@/client/components/dune/duneGraphic';

/** Chip of a setting no AI can play: its name (English, translated on display) and the icon of its tile or row. */
export type AiBlockerChip = {key: string, label: string, iconClass?: string, picture?: string, capitalized?: boolean};

/** Names a reason like the tile or option row it stands for (summary-chip style). */
export function aiBlockerChip(blocker: AiBlocker): AiBlockerChip {
  const key = blocker.kind + ':' + blocker.id;
  switch (blocker.kind) {
  case 'expansion': {
    const choice = [...OFFICIAL_EXPANSIONS, ...FAN_EXPANSIONS].find((entry) => entry.expansion === blocker.id);
    return {key, label: choice?.label ?? blocker.id, iconClass: choice === undefined ? undefined : 'create-game-expansion-icon ' + choice.iconClass};
  }
  case 'board':
    return {key, label: blocker.id, iconClass: boardColorClass(blocker.id), capitalized: true};
  case 'option': {
    const option = AI_OPTION_LABELS[blocker.id];
    return {key, label: option.label, iconClass: option.iconClass === undefined ? undefined : 'create-game-expansion-icon ' + option.iconClass};
  }
  case 'duneModule': {
    const module = blocker.id as DuneModule;
    const icon = DUNE_MODULE_ICON[module];
    return {key, label: DUNE_MODULE_LABEL[module] ?? module, picture: icon === undefined ? undefined : duneGraphic(icon)};
  }
  }
}
