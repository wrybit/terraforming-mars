import {expect} from 'chai';
import {readFileSync} from 'fs';
import {
  detailForSize, PLAYER_CUBE_SPRITE_MANIFEST, SPRITE_ISO_COLUMN, SPRITE_MAX_SIZE, SPRITE_RENDER_SIZE, SPRITE_SLIGHT_COLUMN, SPRITE_TOP_FRAMES, SPRITE_TOP_TURN_STEP, spriteCellOf,
} from '@/client/components/common/playerCubeSprite';
import {playerCubeSpriteHash} from '@/tools/playerCubeSpriteHash';

describe('playerCubeSprite', () => {
  it('matches the current cube look (else: run src/tools/make_player_cube_sprite.ts)', () => {
    const manifest = JSON.parse(readFileSync(PLAYER_CUBE_SPRITE_MANIFEST, 'utf8'));
    expect(manifest.inputsHash).to.eq(playerCubeSpriteHash(process.cwd()));
  });

  it('renders the sheet at the largest size whose reflections are still at their minimum', () => {
    expect(detailForSize(SPRITE_RENDER_SIZE)).to.eq(detailForSize(10));
    expect(detailForSize(SPRITE_RENDER_SIZE + 1)).to.be.greaterThan(detailForSize(SPRITE_RENDER_SIZE));
  });

  it('picks the frame of the turn, repeating every 90°', () => {
    expect(spriteCellOf('red', 'top', 14, 0)).to.deep.eq({row: 0, column: 0});
    const step = SPRITE_TOP_TURN_STEP;
    expect(spriteCellOf('green', 'top', 14, 2 * step)).to.deep.eq({row: 1, column: 2});
    expect(spriteCellOf('green', 'top', 14, 90 + 2 * step)).to.deep.eq({row: 1, column: 2});
    expect(spriteCellOf('green', 'top', 14, 89)).to.deep.eq({row: 1, column: 0});
    expect(spriteCellOf('blue', 'top', 14, undefined)?.column).to.eq(0);
    expect(spriteCellOf('blue', 'top', 14, -step)?.column).to.eq(SPRITE_TOP_FRAMES - 1);
  });

  it('draws very large and freely turned slight/iso cubes live; neutral uses the bronze row', () => {
    expect(spriteCellOf('red', 'top', SPRITE_MAX_SIZE + 1, 0)).to.be.undefined;
    expect(spriteCellOf('red', 'iso', 34, undefined)?.column).to.eq(SPRITE_ISO_COLUMN);
    expect(spriteCellOf('red', 'iso', 14, 30)).to.be.undefined;
    expect(spriteCellOf('red', 'slight', 14, 30)).to.be.undefined;
    expect(spriteCellOf('red', 'slight', 14, undefined)?.column).to.eq(SPRITE_SLIGHT_COLUMN);
    expect(spriteCellOf('neutral', 'top', 14, 0)).to.deep.eq(spriteCellOf('bronze', 'top', 14, 0));
  });
});
