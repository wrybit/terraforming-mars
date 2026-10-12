// Renders the player cubes of player_cube.less once in every color and turn into one WebP sheet with alpha
// (assets/player-cube/sprite.webp), which PlayerCube.vue shows for small cubes instead of CSS 3D.
// Run again after any change to the cube's look:
//   npm run make:css && npm i --no-save playwright-core && npx tsx src/tools/make_player_cube_sprite.ts
// Needs an installed Google Chrome (or CHROME_PATH pointing to a Chromium) and cwebp (libwebp, e.g. brew install webp):
// the browser's own WebP encoder stores the alpha channel losslessly, which makes the sheet three times larger.
import {execFileSync} from 'child_process';
import {mkdirSync, mkdtempSync, readFileSync, writeFileSync} from 'fs';
import {tmpdir} from 'os';
import {dirname, join} from 'path';
import {
  detailForSize, PLAYER_CUBE_SPRITE_MANIFEST, PLAYER_CUBE_SPRITE_URL, SPRITE_CELL_FACTOR, SPRITE_COLUMNS,
  SPRITE_PIXEL_RATIO, SPRITE_RENDER_SIZE, SPRITE_ROWS, SPRITE_SLIGHT_COLUMN, SPRITE_TOP_TURN_STEP,
} from '../client/components/common/playerCubeSprite';
import {playerCubeSpriteHash} from './playerCubeSpriteHash';

const ROOT = process.cwd();
const CELL = SPRITE_RENDER_SIZE * SPRITE_CELL_FACTOR;
// Same as PlayerCube.vue (the hash test notices changes there)
const FACES = ['back', 'right', 'bottom', 'top', 'left', 'front'];
const CAST_SHADOW_STEPS = 6;
// Color and alpha quality of cwebp: the soft shadows stay smooth, the file stays small
const WEBP_ARGUMENTS = ['-q', '85', '-alpha_q', '60', '-m', '6'];
// Alpha (0…255) allowed at the cell border: more means a shadow is cut off, the cell must grow
const BORDER_ALPHA_LIMIT = 8;

function cubeMarkup(color: string, column: number): string {
  const view = column === SPRITE_SLIGHT_COLUMN ? 'slight' : 'top';
  const style = [`--cube-size: ${SPRITE_RENDER_SIZE}px`, `--detail: ${detailForSize(SPRITE_RENDER_SIZE)}`];
  if (view === 'top') {
    style.push(`--cube-turn: ${column * SPRITE_TOP_TURN_STEP}deg`);
  }
  const shadows = Array.from({length: CAST_SHADOW_STEPS}, (_, step) =>
    `<i class="player-cube-shadow player-cube-shadow--cast" style="--shadow-step: ${step / (CAST_SHADOW_STEPS - 1)}"></i>`).join('');
  const faces = FACES.map((face) => `<i class="player-cube-face player-cube-face--${face}"></i>`).join('');
  return `<span class="player-cube player-cube--${view} player-cube--${color}" style="${style.join('; ')}">` +
    `<span class="player-cube-body"><i class="player-cube-shadow player-cube-shadow--rim"></i>${shadows}${faces}</span></span>`;
}

function sheetHtml(css: string): string {
  const cells = SPRITE_ROWS.flatMap((color) =>
    Array.from({length: SPRITE_COLUMNS}, (_, column) => `<div class="cell">${cubeMarkup(color, column)}</div>`)).join('');
  return `<!doctype html><html><head><style>${css}</style><style>
    html, body { margin: 0; background: transparent !important; background-image: none !important; }
    body::before, body::after { display: none !important; }
    .sheet { display: grid; grid-template-columns: repeat(${SPRITE_COLUMNS}, ${CELL}px); grid-auto-rows: ${CELL}px; }
    .cell { display: flex; align-items: center; justify-content: center; }
  </style></head><body><div class="sheet">${cells}</div></body></html>`;
}

async function main(): Promise<void> {
  // Optional tool, not a dependency of the game: only needed to regenerate the sheet (name in a variable,
  // so the type check doesn't require the package)
  const moduleName = 'playwright-core';
  const {chromium} = await import(moduleName).catch(() => {
    throw new Error('playwright-core missing: npm i --no-save playwright-core');
  });
  const css = readFileSync(join(ROOT, 'build/styles.css'), 'utf8');
  const width = SPRITE_COLUMNS * CELL;
  const height = SPRITE_ROWS.length * CELL;
  const browser = await chromium.launch(process.env.CHROME_PATH ? {executablePath: process.env.CHROME_PATH} : {channel: 'chrome'});
  try {
    const page = await browser.newPage({viewport: {width, height}, deviceScaleFactor: SPRITE_PIXEL_RATIO});
    await page.setContent(sheetHtml(css));
    const png = await page.screenshot({omitBackground: true, clip: {x: 0, y: 0, width, height}});
    // Check that no shadow touches a cell border (it would be cut off in the sheet)
    const borderAlpha: number = await page.evaluate(async ({data, cell, ratio}: {data: string, cell: number, ratio: number}) => {
      const image = new Image();
      image.src = 'data:image/png;base64,' + data;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext('2d');
      if (context === null) {
        throw new Error('No 2D canvas');
      }
      context.drawImage(image, 0, 0);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      const size = cell * ratio;
      let maximum = 0;
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          if (x % size === 0 || y % size === 0 || x % size === size - 1 || y % size === size - 1) {
            maximum = Math.max(maximum, pixels[(y * canvas.width + x) * 4 + 3]);
          }
        }
      }
      return maximum;
    }, {data: png.toString('base64'), cell: CELL, ratio: SPRITE_PIXEL_RATIO});
    if (borderAlpha > BORDER_ALPHA_LIMIT) {
      throw new Error(`A cube reaches the cell border (alpha ${borderAlpha}): raise SPRITE_CELL_FACTOR`);
    }
    const imageFile = join(ROOT, PLAYER_CUBE_SPRITE_URL);
    mkdirSync(dirname(imageFile), {recursive: true});
    const pngFile = join(mkdtempSync(join(tmpdir(), 'player-cube-')), 'sprite.png');
    writeFileSync(pngFile, png);
    execFileSync('cwebp', ['-quiet', ...WEBP_ARGUMENTS, pngFile, '-o', imageFile]);
    writeFileSync(join(ROOT, PLAYER_CUBE_SPRITE_MANIFEST), JSON.stringify({inputsHash: playerCubeSpriteHash(ROOT)}, null, 2) + '\n');
    console.log(`${PLAYER_CUBE_SPRITE_URL}: ${width * SPRITE_PIXEL_RATIO}×${height * SPRITE_PIXEL_RATIO} px`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
