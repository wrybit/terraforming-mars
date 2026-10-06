import {expect} from 'chai';
import {sampleGames} from './statsFixtures';
import {allPlayerResults, averageTimeByLineup, playerColors, totalTimeSeconds} from '@/client/components/stats/statsResults';
import {aggregate, entityStats} from '@/client/components/stats/statsAggregate';
import {emptyFilters, filterGames, filterGroups, optionCounts} from '@/client/components/stats/statsFilter';
import {toggleOption} from '@/client/components/cardlist/filterSelection';
import {entityDetail, headToHead, histogram} from '@/client/components/stats/statsDetail';
import {statsRecords} from '@/client/components/stats/statsRecords';
import {parseStatsView, statsHref, tabOfView} from '@/client/components/stats/statsNavigation';
import {withFunderWinShare} from '@/client/components/stats/statsColumns';
import {averageByGeneration, averageCardPoints} from '@/client/components/stats/statsSeries';
import {pointSourcesByPlayer, pointSourcesOverall} from '@/client/components/stats/statsPointSources';
import {combinations} from '@/client/components/stats/statsCombinations';
import {heatmap, heatStep} from '@/client/components/stats/statsHeatmap';
import {chooseMinPlays} from '@/client/components/stats/statsMinPlays';
import {BoardName} from '@/common/boards/BoardName';
import {RANDOM_BOARD} from '@/common/stats/statsBoardKey';

describe('stats logic', () => {
  const games = sampleGames();
  const results = allPlayerResults(games);

  it('corporations count screenshots too, with expected win rate per player count', () => {
    const ecoline = entityStats(results, 'corporation', 'Ecoline');
    expect([ecoline.plays, ecoline.wins, ecoline.games]).deep.eq([3, 3, 3]);
    // two three-player games and one two-player game
    expect(ecoline.expectedWinRate).closeTo((1 / 3 + 1 / 2 + 1 / 3) / 3, 0.0001);
    expect(entityStats(results, 'corporation', 'Helion').winRate).eq(0);
  });

  it('preludes and project cards are told apart by card type', () => {
    expect(aggregate(results, 'prelude').map((entry) => entry.name).sort()).deep.eq(['Donation', 'Mohole']);
    expect(aggregate(results, 'card').map((entry) => entry.name).sort()).deep.eq(['Ants', 'Birds']);
  });

  it('awards are credited to the funder', () => {
    const landlord = withFunderWinShare(entityStats(results, 'award', 'Landlord'), results);
    expect(landlord.players.map((share) => share.name)).deep.eq(['Daniel', 'Jens']);
    expect(landlord.funderWinShare).eq(0);
  });

  it('filters by lineup and counts options against the other filters', () => {
    const groups = filterGroups(games);
    const filters = emptyFilters(groups);
    const lineup = groups.find((group) => group.key === 'lineup')!;
    expect(optionCounts(games, filters, lineup).get('Daniel vs Jens vs Martin')).eq(2);
    toggleOption(filters.selections.lineup, lineup.options.map((option) => option.key), 'Daniel vs Jens');
    expect(filterGames(games, filters).map((game) => game.summary.id)).deep.eq([games[1].summary.id]);
  });

  it('board filter drops games without final state', () => {
    const groups = filterGroups(games);
    const filters = emptyFilters(groups);
    const board = groups.find((group) => group.key === 'board')!;
    toggleOption(filters.selections.board, board.options.map((option) => option.key), 'tharsis');
    expect(filterGames(games, filters)).has.length(1);
  });

  it('detail: companions and player counts', () => {
    const detail = entityDetail(results, 'corporation', 'Ecoline');
    expect(detail.byPlayerCount.map((entry) => [entry.playerCount, entry.plays, entry.wins])).deep.eq([[2, 1, 1], [3, 2, 2]]);
    const cards = detail.companions.find((companion) => companion.kind === 'card')!;
    expect(cards.entries.map((entry) => [entry.name, entry.plays])).deep.eq([['Birds', 2]]);
  });

  it('head to head counts shared games', () => {
    const jens = headToHead(results, 'Jens');
    expect(jens.find((entry) => entry.opponent === 'Daniel')).deep.eq({opponent: 'Daniel', ahead: 2, behind: 1});
  });

  it('records and colors', () => {
    expect(statsRecords(results)[0].entries[0].value).eq(120);
    expect(playerColors(games).get('Martin')).eq('green');
  });

  it('views round-trip through the address', () => {
    const href = statsHref({type: 'detail', kind: 'card', name: 'Ants & Birds'});
    expect(parseStatsView(href.slice(href.indexOf('?')))).deep.eq({type: 'detail', kind: 'card', name: 'Ants & Birds'});
    expect(parseStatsView('?tab=unknown')).deep.eq({type: 'tab', tab: 'overview'});
    // Top 20 page: own address, belongs to the overview tab
    const top = statsHref({type: 'top', kind: 'corporation'});
    expect(parseStatsView(top.slice(top.indexOf('?')))).deep.eq({type: 'top', kind: 'corporation'});
    expect(tabOfView({type: 'top', kind: 'card'})).eq('overview');
    expect(parseStatsView('?top=milestone')).deep.eq({type: 'tab', tab: 'overview'});
  });

  it('averages per generation and card points', () => {
    expect(averageByGeneration([[20, 40], [30, 50, 70]], 1)).deep.eq([25, 45, 70]);
    expect(averageByGeneration([[20, 40], [30, 50, 70], [10, 30, 50]])).deep.eq([20, 40]);
    expect(averageCardPoints(results, 'Birds')).eq(4);
    expect(pointSourcesByPlayer(results).find((row) => row.name === 'Jens')?.games).eq(2);
  });

  it('histograms have no gaps and count wins separately', () => {
    const own = entityDetail(results, 'corporation', 'Ecoline').results;
    const bars = histogram(own, (result) => result.player.victoryPoints, 10);
    expect(bars.reduce((sum, bar) => sum + bar.value, 0)).eq(own.length);
    expect(bars.reduce((sum, bar) => sum + (bar.highlight ?? 0), 0)).eq(own.filter((result) => result.place === 1).length);
    // gapless: consecutive classes of ten
    bars.forEach((bar, index) => expect(Number(bar.label)).eq(Number(bars[0].label) + index * 10));
    expect(histogram([], () => 1, 1)).deep.eq([]);
  });

  it('point sources have an all-games baseline row', () => {
    const baseline = pointSourcesOverall(results);
    expect(baseline?.baseline).eq(true);
    expect(baseline?.games).eq(results.filter((result) => result.details?.victoryPoints !== undefined).length);
  });

  it('combinations count each pair once per player game', () => {
    const pairs = combinations(results, 'corporation', 'card');
    for (const pair of pairs) {
      expect(pair.plays).eq(results.filter((result) =>
        entityStats([result], 'corporation', pair.first).plays > 0 && entityStats([result], 'card', pair.second).plays > 0).length);
      expect(pair.winRate).within(0, 1);
    }
    // Same kind: no pair with itself, no duplicate order
    for (const pair of combinations(results, 'card', 'card')) {
      expect(pair.first < pair.second).eq(true);
    }
  });

  it('heatmap counts tiles per space on the chosen board only', () => {
    const [first, second] = games;
    const withTiles = [
      {...first, details: {...first.details!, boardName: BoardName.THARSIS, tiles: [{spaceId: '20' as const, type: 'city' as const, playerName: 'Jens'}]}},
      {...second, details: {...second.details!, boardName: BoardName.THARSIS, tiles: [
        {spaceId: '20' as const, type: 'city' as const, playerName: 'Daniel'},
        {spaceId: '21' as const, type: 'greenery' as const, playerName: 'Daniel'},
      ]}},
    ];
    const cities = heatmap(withTiles, BoardName.THARSIS, 'city', undefined);
    expect([cities.games, cities.counts.get('20'), cities.maximum]).deep.eq([2, 2, 2]);
    expect(heatmap(withTiles, BoardName.THARSIS, 'city', 'Jens').counts.get('20')).eq(1);
    expect(heatmap(withTiles, BoardName.HELLAS, 'city', undefined).games).eq(0);
    // Colour levels of 10 %: 1–10 % → 1, 11–20 % → 2, 100 % → 10
    expect([heatStep(1), heatStep(10), heatStep(11), heatStep(80), heatStep(100)]).deep.eq([1, 1, 2, 8, 10]);
  });

  it('counts shuffled boards as "random" instead of the board they were shuffled from', () => {
    const [first, second] = games;
    const tiles = [{spaceId: '20' as const, type: 'city' as const, playerName: 'Jens'}];
    const mixed = [
      {...first, details: {...first.details!, boardName: BoardName.THARSIS, tiles}},
      {...second, details: {...second.details!, boardName: BoardName.THARSIS, shuffledBoard: true, tiles}},
    ];
    const mixedResults = allPlayerResults(mixed);
    expect(entityStats(mixedResults, 'board', BoardName.THARSIS).games).eq(1);
    expect(entityStats(mixedResults, 'board', RANDOM_BOARD).games).eq(1);
    expect(filterGroups(mixed).find((group) => group.key === 'board')?.options.map((option) => option.key)).deep.eq([RANDOM_BOARD, BoardName.THARSIS]);
    expect(heatmap(mixed, BoardName.THARSIS, 'city', undefined).games).eq(1);
    expect(heatmap(mixed, RANDOM_BOARD, 'city', undefined).games).eq(1);
  });

  it('minimum plays keep at least ten rows visible', () => {
    expect(chooseMinPlays(Array(12).fill(3))).eq(3);
    expect(chooseMinPlays([5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1])).eq(1);
  });

  it('adds up the thinking time of all players, only when known for everyone', () => {
    const [threePlayers, , screenshotOnly] = sampleGames();
    expect(totalTimeSeconds(threePlayers)).eq(1800 * threePlayers.details!.players.length);
    expect(totalTimeSeconds(screenshotOnly)).is.undefined;
    const partial = {...threePlayers, details: {...threePlayers.details!, players: threePlayers.details!.players.map((player, index) => index === 0 ? {...player, timeSeconds: undefined} : player)}};
    expect(totalTimeSeconds(partial)).is.undefined;
  });

  it('average game length per line-up', () => {
    const times = averageTimeByLineup(games);
    expect(times.get('Daniel vs Jens vs Martin')).eq(5400);
    expect(times.get('Daniel vs Jens')).eq(3600);
  });
});
