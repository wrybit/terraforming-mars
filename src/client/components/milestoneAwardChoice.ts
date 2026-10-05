import {Message} from '@/common/logs/Message';
import {PlayerInputModel} from '@/common/models/PlayerInputModel';

// Selection of a milestone or award (Player.ts: sub-options carry the name as their title;
// Vitor's free award: sub-options carry it as the first message parameter, see milestoneAwardOptionName).
// OrOptions shows such selections as image tiles (MilestoneAwardOptions.vue) instead of a radio list.
export type MilestoneAwardKind = 'milestones' | 'awards';

const CHOICE_TITLES: Readonly<Record<string, MilestoneAwardKind>> = {
  'Claim a milestone': 'milestones',
  'Fund an award (${0} M€)': 'awards',
  'Select award to fund': 'awards',
};

function titleKey(title: string | Message): string {
  return typeof title === 'string' ? title : title.message;
}

export function milestoneAwardKind(input: PlayerInputModel): MilestoneAwardKind | undefined {
  return CHOICE_TITLES[titleKey(input.title)];
}

// Name of the milestone/award of a sub-option: plain title (Player.ts) or first parameter of a message (Vitor.ts)
export function milestoneAwardOptionName(option: PlayerInputModel): string {
  const title = option.title;
  if (typeof title === 'string') {
    return title;
  }
  const first = title.data[0];
  return first !== undefined ? String(first.value) : title.message;
}

// Same image class as on the board (Milestone.vue / Award.vue, player_home.less: .ma-name--<name>)
export function milestoneAwardImageClass(name: string): string {
  return 'ma-name--' + name.replaceAll(' ', '-').replaceAll('.', '').toLowerCase();
}
