import {expect} from 'chai';
import {DUNE_NAMES, drawDuneNames, withoutDrawnDuneNames} from '@/client/components/create/duneNames';

describe('duneNames', () => {
  it('has about 30 different people', () => {
    expect(DUNE_NAMES.length).to.be.at.least(30);
    expect(new Set(DUNE_NAMES).size).eq(DUNE_NAMES.length);
  });

  it('draws distinct names and skips names already typed', () => {
    const drawn = drawDuneNames(5, ['stilgar', ''], () => 0.5);
    expect(drawn).length(5);
    expect(new Set(drawn).size).eq(5);
    expect(drawn).not.include('Stilgar');
  });

  it('never draws more names than it has', () => {
    expect(drawDuneNames(40, [])).length(DUNE_NAMES.length);
  });

  it('empties drawn names but keeps typed ones', () => {
    const players = [{name: 'Stilgar'}, {name: 'Chani'}, {name: 'Jens'}];
    expect(withoutDrawnDuneNames(players, ['Stilgar', '', 'Jens']).map((player) => player.name)).deep.eq(['Stilgar', '', 'Jens']);
  });
});
