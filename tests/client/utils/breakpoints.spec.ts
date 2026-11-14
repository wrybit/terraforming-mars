import {expect} from 'chai';
import {readFileSync, readdirSync} from 'fs';
import {BREAKPOINTS, belowWidth, fromWidth} from '@/client/utils/breakpoints';

const LESS = readFileSync('src/styles/breakpoints.less', 'utf8');

// Value of a Less variable such as `@bp-tablet: 600px;`
function lessPixels(name: string): number {
  const match = LESS.match(new RegExp(`^@${name}:\\s*(\\d+)px;`, 'm'));
  expect(match, `@${name} in breakpoints.less`).to.not.be.null;
  return Number(match![1]);
}

function lessQuery(name: string): string {
  const match = LESS.match(new RegExp(`^@${name}:\\s*~"([^"]+)";`, 'm'));
  expect(match, `@${name} in breakpoints.less`).to.not.be.null;
  return match![1];
}

describe('breakpoints contract', () => {
  it('carries the same values in Less and TypeScript', () => {
    expect(lessPixels('bp-compact-phone')).to.eq(BREAKPOINTS.compactPhone);
    expect(lessPixels('bp-tablet')).to.eq(BREAKPOINTS.tablet);
    expect(lessPixels('bp-wide')).to.eq(BREAKPOINTS.wide);
    expect(lessPixels('bp-desktop')).to.eq(BREAKPOINTS.desktop);
    expect(lessPixels('bp-short-height')).to.eq(BREAKPOINTS.shortHeight);
  });

  it('builds the same media queries as the Less variables', () => {
    expect(lessQuery('below-compact-phone')).to.eq(belowWidth(BREAKPOINTS.compactPhone));
    expect(lessQuery('below-tablet')).to.eq(belowWidth(BREAKPOINTS.tablet));
    expect(lessQuery('from-tablet')).to.eq(fromWidth(BREAKPOINTS.tablet));
    expect(lessQuery('below-wide')).to.eq(belowWidth(BREAKPOINTS.wide));
    expect(lessQuery('from-wide')).to.eq(fromWidth(BREAKPOINTS.wide));
    expect(lessQuery('below-desktop')).to.eq(belowWidth(BREAKPOINTS.desktop));
    expect(lessQuery('from-desktop')).to.eq(fromWidth(BREAKPOINTS.desktop));
  });

  it('keeps raw pixel widths out of the media queries of all other style files', () => {
    // Content thresholds that depend on a component's own width are allowed with a named variable in their file;
    // a bare number in @media is a breakpoint that bypasses the scale
    const offenders: Array<string> = [];
    for (const file of readdirSync('src/styles')) {
      if (!file.endsWith('.less') || file === 'breakpoints.less') {
        continue;
      }
      const text = readFileSync(`src/styles/${file}`, 'utf8');
      for (const match of text.matchAll(/@media[^{]*\b(?:min|max)-(?:width|height):\s*\d+px/g)) {
        offenders.push(`${file}: ${match[0]}`);
      }
    }
    expect(offenders).to.deep.eq([]);
  });
});
