import {expect} from 'chai';
import {sampleGames} from './statsFixtures';
import {allPlayerResults, playerColors} from '@/client/components/stats/statsResults';
import {aggregate, entityStats} from '@/client/components/stats/statsAggregate';
import {emptyFilters, filterGames, filterGroups, optionCounts} from '@/client/components/stats/statsFilter';
import {toggleOption} from '@/client/components/cardlist/filterSelection';
import {entityDetail, headToHead, histogram} from '@/client/components/stats/statsDetail';
import {statsRecords} from '@/client/components/stats/statsRecords';
import {parseStatsView, statsHref} from '@/client/components/stats/statsNavigation';
import {withFunderWinShare} from '@/client/components/stats/statsColumns';
import {averageByGeneration, averageCardPoints} from '@/client/components/stats/statsSeries';
import {pointSourcesByPlayer, pointSourcesOverall} from '@/client/components/stats/statsPointSources';

describe('stats logic', () => {
  const games = sampleGames();
  const results = allPlayerResults(games);

  it('corporations count screenshots too, with expected win rate per player count', () => {
    const ecoline = entityStats(results, 'corporation', 'Ecoline');
    expect([ecoline.plays, ecoline.wins, ecoline.games]).deep.eq([3, 3, 3]);
    // zwei Dreierpartien und eine Zweierpartie
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
    // lückenlos: aufeinanderfolgende Zehnerklassen
    bars.forEach((bar, index) => expect(Number(bar.label)).eq(Number(bars[0].label) + index * 10));
    expect(histogram([], () => 1, 1)).deep.eq([]);
  });

  it('point sources have an all-games baseline row', () => {
    const baseline = pointSourcesOverall(results);
    expect(baseline?.baseline).eq(true);
    expect(baseline?.games).eq(results.filter((result) => result.details?.victoryPoints !== undefined).length);
  });
});
