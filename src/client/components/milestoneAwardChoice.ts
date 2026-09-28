import {Message} from '@/common/logs/Message';
import {PlayerInputModel} from '@/common/models/PlayerInputModel';

// Auswahl eines Meilensteins bzw. einer Auszeichnung (Player.ts: Unteroptionen tragen den Namen als Titel).
// Solche Auswahlen zeigt OrOptions als Bild-Kacheln (MilestoneAwardOptions.vue) statt als Radio-Liste.
export type MilestoneAwardKind = 'milestones' | 'awards';

const CHOICE_TITLES: Readonly<Record<string, MilestoneAwardKind>> = {
  'Claim a milestone': 'milestones',
  'Fund an award (${0} M€)': 'awards',
};

function titleKey(title: string | Message): string {
  return typeof title === 'string' ? title : title.message;
}

export function milestoneAwardKind(input: PlayerInputModel): MilestoneAwardKind | undefined {
  return CHOICE_TITLES[titleKey(input.title)];
}

// Gleiche Bildklasse wie auf dem Brett (Milestone.vue / Award.vue, player_home.less: .ma-name--<name>)
export function milestoneAwardImageClass(name: string): string {
  return 'ma-name--' + name.replaceAll(' ', '-').replaceAll('.', '').toLowerCase();
}
