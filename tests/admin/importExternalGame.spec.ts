import {expect, use} from 'chai';
import chaiAsPromised from 'chai-as-promised';
import {importExternalGame, parseExternalLink, toExternalLink} from '../../src/server/admin/importExternalGame';
import {Phase} from '../../src/common/Phase';
use(chaiAsPromised);

describe('importExternalGame', () => {
  const link = 'https://terraforming-mars.herokuapp.com/the-end?id=p66b9daab6513';
  const view = {
    color: 'blue',
    game: {phase: Phase.END, generation: 2, isSoloModeWin: false},
    players: [
      {name: 'Daniel', color: 'red', megacredits: 63, victoryPointsBreakdown: {total: 66}},
      {name: 'Jens', color: 'blue', megacredits: 85, victoryPointsBreakdown: {total: 76}},
      {name: 'Martin', color: 'green', megacredits: 69, victoryPointsBreakdown: {total: 75}},
    ],
  };

  // Responds like the external server: view for api/player, one log per generation
  function fakeServer(requested: Array<string> = []) {
    return async (url: string) => {
      requested.push(url);
      const generation = new URL(url).searchParams.get('generation');
      return generation === null ? view : [{message: `gen ${generation}`}];
    };
  }

  it('turns page links into the server base and participant', () => {
    expect(parseExternalLink(link)).deep.eq({baseUrl: 'https://terraforming-mars.herokuapp.com/', participantId: 'p66b9daab6513', host: 'terraforming-mars.herokuapp.com'});
    expect(parseExternalLink('https://example.org/tm/spectator?id=s123456789abc').baseUrl).eq('https://example.org/tm/');
  });

  it('a bare id means the public main server', () => {
    expect(toExternalLink(' p66b9daab6513 ')).eq(link);
  });

  it('rejects links without a safe participant id', () => {
    expect(() => parseExternalLink('https://example.org/the-end?id=g123')).to.throw();
    expect(() => parseExternalLink('https://example.org/the-end?id=p../../etc')).to.throw();
    expect(() => parseExternalLink('no link')).to.throw();
    expect(() => parseExternalLink('ftp://example.org/the-end?id=p123')).to.throw();
  });

  it('keeps the full view and every generation of the log', async () => {
    const requested: Array<string> = [];
    const {snapshot} = await importExternalGame(link, fakeServer(requested));
    expect(requested).deep.eq([
      'https://terraforming-mars.herokuapp.com/api/player?id=p66b9daab6513',
      'https://terraforming-mars.herokuapp.com/api/game/logs?id=p66b9daab6513&generation=1',
      'https://terraforming-mars.herokuapp.com/api/game/logs?id=p66b9daab6513&generation=2',
    ]);
    expect(snapshot.participantId).eq('p66b9daab6513');
    expect(snapshot.view).eq(view);
    expect(snapshot.logsByGeneration[2]).deep.eq([{message: 'gen 2'}]);
  });

  it('builds the result with winner and links to the local copy', async () => {
    const {summary} = await importExternalGame(link, fakeServer(), () => 1234);
    expect(summary.id).eq('import-terraforming-mars.herokuapp.com-p66b9daab6513');
    expect(summary.source).eq('imported');
    expect(summary.createdTimeMs).eq(1234);
    expect(summary.isFinished).is.true;
    expect(summary.importedParticipantId).eq('p66b9daab6513');
    expect(summary.spectatorUrl).eq('the-end?id=p66b9daab6513');
    expect(summary.externalUrl).eq(link);
    expect(summary.players.map((p) => [p.name, p.victoryPoints, p.isWinner])).deep.eq([['Daniel', 66, false], ['Jens', 76, true], ['Martin', 75, false]]);
    expect(summary.players.map((p) => p.url)).deep.eq([undefined, 'the-end?id=p66b9daab6513', undefined]);
  });

  it('fails clearly when the other server returns no game', async () => {
    await expect(importExternalGame(link, async () => ({}))).to.be.rejectedWith('did not return a game');
  });
});
