import {expect} from 'chai';
import {bounceGlyph, wormBounceMarks, wormEffect, wormOutcome} from '@/client/components/dune/wormMoveDisplay';
import {TileType} from '@/common/TileType';
import {SpaceType} from '@/common/boards/SpaceType';
import {SpaceModel} from '@/common/models/SpaceModel';

const at = (x: number, y = 0) => ({x, y});

function space(tileType: TileType | undefined, color?: 'red' | 'yellow'): SpaceModel {
  return {id: '01', spaceType: SpaceType.LAND, bonus: [], tileType, color} as SpaceModel;
}

describe('Worm move display', () => {
  it('puts a disc on every edge the worm crosses, no wall on a straight way', () => {
    const marks = wormBounceMarks([at(0), at(46), at(92), at(138)], 2);
    expect(marks.walls).is.empty;
    expect(marks.headings.map((heading) => [heading.x, heading.angle])).deep.eq([[23, 0], [69, 0], [115, 0]]);
  });

  // Jens, 21 Oct 2026: right, back over its own space, on to the left – the two discs on the shared edge sit side by
  // side, and the space it bounced off is marked
  it('bounces straight back: the wall beyond, the two discs of the shared edge side by side', () => {
    const marks = wormBounceMarks([at(0), at(46), at(0), at(-46)], 2);
    expect(marks.walls).has.length(1);
    expect(marks.walls[0].x1).closeTo(70.5, 0.01);
    expect(marks.walls[0].obstacle).deep.eq({x: 92, y: 0});
    expect(marks.headings).has.length(3);
    const [out, back] = marks.headings;
    expect(out.x).closeTo(23, 0.01);
    expect(back.x).closeTo(23, 0.01);
    expect(marks.walls[0].disc.glyph).deep.eq(bounceGlyph(180));
    expect(Math.abs(out.y - back.y)).closeTo(18, 0.01);
    expect(Math.abs(back.angle)).eq(180);
  });

  it('shows the wall at the start when the rolled heading was blocked', () => {
    // Rolled right (2), left the space to the left
    const marks = wormBounceMarks([at(0), at(-46)], 2);
    expect(marks.walls).has.length(1);
    expect(marks.walls[0].x1).closeTo(24.5, 0.01);
    expect(marks.headings).has.length(1);
    expect(Math.abs(marks.headings[0].angle)).eq(180);
  });

  it('draws a bounce straight back as a U-turn and a slanted one as a bend', () => {
    expect(bounceGlyph(180).line).contains('A');
    expect(bounceGlyph(-180)).deep.eq(bounceGlyph(180));
    expect(bounceGlyph(120).line).contains('Q');
    expect(bounceGlyph(120)).not.deep.eq(bounceGlyph(-120));
    // Inside the 16 × 16 box for every case
    for (const turn of [180, 120, -120, 60]) {
      const numbers = (bounceGlyph(turn).line + bounceGlyph(turn).head).replace(/A[^0-9-]*[0-9.]+ [0-9.]+ 0 0 0 /, ' ').match(/-?[0-9.]+/g)?.map(Number) ?? [];
      expect(Math.min(...numbers), String(turn)).is.greaterThan(0);
      expect(Math.max(...numbers), String(turn)).is.lessThan(16);
    }
  });

  it('describes what the worm does to a tile', () => {
    expect(wormEffect(space(TileType.GREENERY, 'red'), [])?.chip).deep.eq({tone: 'loss', items: [{amount: -3, resource: 'res-plant'}]});
    expect(wormEffect(space(TileType.CITY, 'red'), [])?.chip.items).has.length(2);
    expect(wormEffect(space(TileType.OCEAN), [space(TileType.CITY, 'red'), space(undefined)])?.chip.times).eq(1);
    expect(wormEffect(space(undefined), [])).is.undefined;
    expect(wormOutcome([wormEffect(space(TileType.OCEAN), [])])).is.empty;
  });
});
