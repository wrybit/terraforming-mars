// Colour of a blink: orange-red when a player took something away from another player
// (resources stolen or removed, production lowered), white for everything else – also when a
// player spends their own resources. Attacks thus stand out at a glance.
import {flashPlayerOf} from '@/client/utils/changeFlashKeys';

export type FlashTone = 'gain' | 'loss';

const TONE_RGB: Record<FlashTone, string> = {
  gain: '255, 255, 255',
  loss: '255, 100, 40',
};

export function toneColor(tone: FlashTone, alpha = 1): string {
  return `rgba(${TONE_RGB[tone]}, ${alpha})`;
}

// An attack: a player value went down and the player is not the one who made the move
export function isAttack(key: string, before: string | undefined, after: string, actorColor: string | undefined): boolean {
  const owner = flashPlayerOf(key);
  if (owner === undefined || actorColor === undefined || owner === actorColor) {
    return false;
  }
  const previous = parseFloat(before ?? '');
  const current = parseFloat(after);
  return !Number.isNaN(previous) && !Number.isNaN(current) && current < previous;
}
