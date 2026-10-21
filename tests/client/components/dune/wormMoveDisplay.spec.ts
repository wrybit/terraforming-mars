import {expect} from 'chai';
import {wormBounceMarks, wormEffect, wormOutcome} from '@/client/components/dune/wormMoveDisplay';
import {TileType} from '@/common/TileType';
import {SpaceType} from '@/common/boards/SpaceType';
import {SpaceModel} from '@/common/models/SpaceModel';

const at = (x: number, y = 0) => ({x, y});

function space(tileType: TileType | undefined, color?: 'red' | 'yellow'): SpaceModel {
  return {id: '01', spaceType: SpaceType.LAND, bonus: [], tileType, color} as SpaceModel;
}

describe('Worm move display', () => {
  it('marks only the start of a straight way', () => {
    const marks = wormBounceMarks([at(0), at(46), at(92), at(138)], 2);
    expect(marks.walls).is.empty;
    expect(marks.headings).has.length(1);
    expect(marks.headings[0]).deep.include({x: 23, y: 0, angle: 0});
  });

  // Jens, 21 Oct 2026: right, back over its own space, on to the left – the disc of the way back must not hide the
  // first one, and the wall shows where it bounced
  it('bounces straight back: a wall on the far edge and a second disc inside that space', () => {
    const marks = wormBounceMarks([at(0), at(46), at(0), at(-46)], 2);
    expect(marks.walls).has.length(1);
    expect(marks.walls[0].x1).closeTo(69, 0.01);
    expect(marks.walls[0].x2).closeTo(69, 0.01);
    // The blocked space beyond, where the bounce is marked
    expect(marks.walls[0].obstacle).deep.eq({x: 92, y: 0});
    expect(marks.headings).has.length(2);
    expect(marks.headings[0].angle).eq(0);
    expect(Math.abs(marks.headings[1].angle)).eq(180);
    expect(marks.headings[1].x).is.greaterThan(46);
    expect(marks.headings[1].x).is.lessThan(69);
  });

  it('shows the wall at the start when the rolled heading was blocked', () => {
    // Rolled right (2), left the space to the left
    const marks = wormBounceMarks([at(0), at(-46)], 2);
    expect(marks.walls).has.length(1);
    expect(marks.walls[0].x1).closeTo(23, 0.01);
    expect(marks.headings).has.length(1);
    expect(Math.abs(marks.headings[0].angle)).eq(180);
  });

  it('describes what the worm does to a tile', () => {
    expect(wormEffect(space(TileType.GREENERY, 'red'), [])?.chip).deep.eq({tone: 'loss', items: [{amount: -3, resource: 'res-plant'}]});
    expect(wormEffect(space(TileType.CITY, 'red'), [])?.chip.items).has.length(2);
    expect(wormEffect(space(TileType.OCEAN), [space(TileType.CITY, 'red'), space(undefined)])?.chip.times).eq(1);
    expect(wormEffect(space(undefined), [])).is.undefined;
    expect(wormOutcome([wormEffect(space(TileType.OCEAN), [])])).is.empty;
  });
});
