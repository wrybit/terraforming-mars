import {AiBlocker} from '@/common/ai/aiCompatibility';
import {FAN_EXPANSIONS, OFFICIAL_EXPANSIONS} from './createGameChoices';
import {AI_OPTION_LABELS} from './aiOptionLabels';
import {AI_SETUP_LABELS} from './aiSetupLabels';
import {boardColorClass} from './boardColorClass';

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
  case 'duneModule':
    return {key, label: blocker.id};
  case 'setup': {
    const setup = AI_SETUP_LABELS[blocker.id];
    return {key, label: setup.label, iconClass: setup.iconClass === undefined ? undefined : 'create-game-expansion-icon ' + setup.iconClass};
  }
  }
}
