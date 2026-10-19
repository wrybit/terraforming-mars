import {expect} from 'chai';
import {KanlyModel} from '@/common/dune/DuneModel';
import {battleWinner} from '@/common/dune/kanlyBattle';
import {arrakisNeighbours, arrakisSpacePosition} from '@/common/dune/arrakisCoordinates';
import {kanlyForecast, kanlySendConversion} from '@/client/components/dune/kanlyForecast';
import {KANLY_SEND_TITLE} from '@/common/dune/duneActionTitles';
import {PlayerViewModel} from '@/common/models/PlayerModel';

const players = [{color: 'red'}, {color: 'yellow'}, {color: 'blue'}] as const;

function kanly(troops: Array<{color: 'red' | 'yellow' | 'blue', sardaukar: number}>): KanlyModel {
  return {
    garrisons: [{color: 'red', sardaukar: 3}, {color: 'yellow', sardaukar: 1}, {color: 'blue', sardaukar: 0}],
    battle: {spaceId: '20', owner: 'yellow', opener: 'red', troops},
    foughtThisGeneration: true,
  };
}

describe('Kanly forecast', () => {
  it('needs more Sardaukar than the owner and every other challenger; a tie keeps the tile', () => {
    expect(battleWinner('o', [{key: 'o', sardaukar: 2}, {key: 'a', sardaukar: 3}])).eq('a');
    expect(battleWinner('o', [{key: 'o', sardaukar: 2}, {key: 'a', sardaukar: 2}])).is.undefined;
    expect(battleWinner('o', [{key: 'a', sardaukar: 3}, {key: 'b', sardaukar: 3}])).is.undefined;
    expect(battleWinner('o', [{key: 'a', sardaukar: 3}, {key: 'b', sardaukar: 4}])).eq('b');
  });

  it('lists the owner first and every player, with the Sardaukar about to be sent', () => {
    const forecast = kanlyForecast(kanly([{color: 'red', sardaukar: 2}, {color: 'yellow', sardaukar: 1}]), players, {color: 'yellow', amount: 1});
    expect(forecast?.forces.map((force) => [force.color, force.sardaukar, force.added, force.owner, force.opener])).deep.eq([
      ['yellow', 1, 1, true, false],
      ['red', 2, 0, false, true],
      ['blue', 0, 0, false, false],
    ]);
    // 2 : 2 – the owner keeps the tile
    expect(forecast?.holder).eq('yellow');
    expect(forecast?.changes).is.false;
  });

  it('shows the tile changing hands when a challenger leads', () => {
    const forecast = kanlyForecast(kanly([{color: 'red', sardaukar: 2}]), players);
    expect([forecast?.holder, forecast?.changes]).deep.eq(['red', true]);
  });

  it('sends from the garrison to the war field, with the own numbers', () => {
    const view = {game: {dune: {kanly: kanly([{color: 'red', sardaukar: 2}])}}, thisPlayer: {color: 'red'}} as unknown as PlayerViewModel;
    const conversion = kanlySendConversion(KANLY_SEND_TITLE, view);
    expect(conversion?.from).deep.include({kind: 'figure', label: 'Garrison', before: 3});
    expect(conversion?.to).deep.include({kind: 'figure', label: 'War field', before: 2});
    expect(kanlySendConversion('Select amount of energy to spend', view)).is.undefined;
  });
});

describe('Arrakis geometry', () => {
  it('places the spaces like the drawn board', () => {
    expect(arrakisSpacePosition('03')).deep.eq({x: 104, y: 34});
    expect(arrakisSpacePosition('08')).deep.eq({x: 79.5, y: 75});
    expect(arrakisSpacePosition('99')).is.undefined;
  });

  it('finds six neighbours inside and fewer at the rim', () => {
    expect(arrakisNeighbours('32').sort()).deep.eq(['23', '24', '31', '33', '40', '41']);
    expect(arrakisNeighbours('03').sort()).deep.eq(['04', '08', '09']);
  });
});
