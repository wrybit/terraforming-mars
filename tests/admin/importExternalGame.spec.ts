import {expect, use} from 'chai';
import chaiAsPromised from 'chai-as-promised';
import {importExternalGame, toExternalApiUrl} from '../../src/server/admin/importExternalGame';
import {Phase} from '../../src/common/Phase';
use(chaiAsPromised);

describe('importExternalGame', () => {
  const link = 'https://terraforming-mars.herokuapp.com/the-end?id=p66b9daab6513';
  const view = {
    color: 'blue',
    game: {phase: Phase.END, generation: 10, isSoloModeWin: false},
    players: [
      {name: 'Daniel', color: 'red', megacredits: 63, victoryPointsBreakdown: {total: 66}},
      {name: 'Jens', color: 'blue', megacredits: 85, victoryPointsBreakdown: {total: 76}},
      {name: 'Martin', color: 'green', megacredits: 69, victoryPointsBreakdown: {total: 75}},
    ],
  };

  it('turns page links into api links', () => {
    expect(toExternalApiUrl(link).apiUrl).eq('https://terraforming-mars.herokuapp.com/api/player?id=p66b9daab6513');
    expect(toExternalApiUrl('https://example.org/tm/spectator?id=s123456789abc').apiUrl).eq('https://example.org/tm/api/spectator?id=s123456789abc');
  });

  it('a bare id means the public main server', async () => {
    let requested = '';
    const summary = await importExternalGame(' p66b9daab6513 ', async (url) => {
      requested = url;
      return view;
    });
    expect(requested).eq('https://terraforming-mars.herokuapp.com/api/player?id=p66b9daab6513');
    expect(summary.externalUrl).eq(link);
  });

  it('rejects links without a participant id', () => {
    expect(() => toExternalApiUrl('https://example.org/the-end?id=g123')).to.throw();
    expect(() => toExternalApiUrl('no link')).to.throw();
    expect(() => toExternalApiUrl('ftp://example.org/the-end?id=p123')).to.throw();
  });

  it('builds the result with winner and own link', async () => {
    const summary = await importExternalGame(link, async () => view, () => 1234);
    expect(summary.id).eq('import-terraforming-mars.herokuapp.com-p66b9daab6513');
    expect(summary.source).eq('imported');
    expect(summary.createdTimeMs).eq(1234);
    expect(summary.isFinished).is.true;
    expect(summary.generation).eq(10);
    expect(summary.players.map((p) => [p.name, p.victoryPoints, p.isWinner])).deep.eq([['Daniel', 66, false], ['Jens', 76, true], ['Martin', 75, false]]);
    expect(summary.players.map((p) => p.url)).deep.eq([undefined, link, undefined]);
  });

  it('fails clearly when the other server returns no game', async () => {
    await expect(importExternalGame(link, async () => ({}))).to.be.rejectedWith('did not return a game');
  });
});
