// Colour of a blink: white for gains and neutral changes, orange-red when a value went down
// (spent, stolen, lost production), so losses stand out from everything else at a glance.
export type FlashTone = 'gain' | 'loss';

const TONE_RGB: Record<FlashTone, string> = {
  gain: '255, 255, 255',
  loss: '255, 100, 40',
};

export function toneColor(tone: FlashTone, alpha = 1): string {
  return `rgba(${TONE_RGB[tone]}, ${alpha})`;
}

// Only numbers have a direction; tiles, owners etc. are always neutral
export function toneOf(previousValue: string | undefined, currentValue: string | undefined): FlashTone {
  const before = parseFloat(previousValue ?? '');
  const after = parseFloat(currentValue ?? '');
  return !Number.isNaN(before) && !Number.isNaN(after) && after < before ? 'loss' : 'gain';
}
