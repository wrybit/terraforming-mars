// Fingerprint of everything the pre-rendered cube sheet depends on. The generator stores it next to the sheet,
// a test compares it with the current files: changing the cube's look without regenerating fails the test.
import {createHash} from 'crypto';
import {readFileSync} from 'fs';
import {join} from 'path';

const INPUTS = [
  'src/client/components/common/PlayerCube.vue',
  'src/client/components/common/playerCubeSprite.ts',
  'src/styles/player_cube.less',
];

export function playerCubeSpriteHash(root: string): string {
  const hash = createHash('sha256');
  for (const file of INPUTS) {
    // Line endings differ between checkouts (Windows): they don't change the picture
    hash.update(readFileSync(join(root, file), 'utf8').replace(/\r\n/g, '\n'));
  }
  // Only the player colors of variables.less matter, not the many other variables there
  const colors = readFileSync(join(root, 'src/styles/variables.less'), 'utf8').split(/\r?\n/).filter((line) => /^@player_[a-z]+:/.test(line));
  hash.update(colors.join('\n'));
  return hash.digest('hex').slice(0, 16);
}
