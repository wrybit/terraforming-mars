import {expect} from 'chai';
import * as os from 'os';
import * as path from 'path';
import {mkdtempSync, rmSync} from 'fs';
import {collectStatsGames, forgetStatsGamesForTesting} from '../../src/server/stats/collectStatsGames';
import {ImportedGamesStore} from '../../src/server/admin/ImportedGamesStore';
import {ImportedSnapshotsStore} from '../../src/server/admin/ImportedSnapshotsStore';
import {FakeGameLoader} from '../routes/FakeGameLoader';
import {testGame} from '../TestGame';
import {addCity, addGreenery} from '../TestingUtils';
import {Phase} from '../../src/common/Phase';
import {Server} from '../../src/server/models/ServerModel';
import {AdminGameSummary} from '../../src/common/admin/AdminGameSummary';
import {CardName} from '../../src/common/cards/CardName';
import {EcoLine} from '../../src/server/cards/corporation/Ecoline';

describe('collectStatsGames', () => {
  let folder: string;
  let importedGames: ImportedGamesStore;
  let snapshots: ImportedSnapshotsStore;
  let gameLoader: FakeGameLoader;

  beforeEach(() => {
    forgetStatsGamesForTesting();
    folder = mkdtempSync(path.join(os.tmpdir(), 'stats-'));
    importedGames = new ImportedGamesStore(path.join(folder, 'imported-games.json'));
    snapshots = new ImportedSnapshotsStore(path.join(folder, 'imported'));
    gameLoader = new FakeGameLoader();
  });

  afterEach(() => rmSync(folder, {recursive: true, force: true}));

  function importedSummary(id: string, participantId: string | undefined, screenshotUrl?: string): AdminGameSummary {
    return {
      id, source: 'imported', createdTimeMs: 1, isFinished: true, generation: 9, spectatorUrl: undefined, externalUrl: 'https://example.com',
      importedParticipantId: participantId, screenshotUrl,
      players: [{name: 'Jens', color: 'blue', url: 'player?id=psecret', victoryPoints: 80, megaCredits: 3, isWinner: true, corporation: 'Ecoline'}],
    };
  }

  it('skips running games and reads details of finished ones', async () => {
    const [running] = testGame(2, {}, 'running');
    const [finished, player] = testGame(2, {}, 'finished');
    player.playCorporationCard(new EcoLine());
    addGreenery(player);
    addCity(player);
    finished.phase = Phase.END;
    await gameLoader.add(running);
    await gameLoader.add(finished);

    const games = await collectStatsGames(gameLoader, importedGames, snapshots);

    expect(games).has.length(1);
    const [game] = games;
    expect(game.summary.id).eq(finished.id);
    expect(game.resultUrl).eq(`the-end?id=${finished.playersInGenerationOrder[0].id}`);
    const details = game.details!;
    const playerDetails = details.players.find((entry) => entry.name === player.name)!;
    expect(playerDetails.cards).includes(CardName.ECOLINE);
    expect([playerDetails.greeneries, playerDetails.cities]).deep.eq([1, 1]);
  });

  it('never exposes player or spectator links', async () => {
    const [finished] = testGame(2, {}, 'links');
    finished.phase = Phase.END;
    await gameLoader.add(finished);
    importedGames.add(importedSummary('imported', undefined, 'imported-screenshot?id=1'));

    const games = await collectStatsGames(gameLoader, importedGames, snapshots);

    for (const game of games) {
      expect(game.summary.spectatorUrl).is.undefined;
      expect(game.summary.players.map((entry) => entry.url)).deep.eq(game.summary.players.map(() => undefined));
    }
  });

  it('imported games: details from the saved final state, screenshots without details', async () => {
    const [source] = testGame(2, {}, 'source');
    snapshots.save({participantId: 'pimported', view: Server.getSpectatorModel(source), logsByGeneration: {}});
    importedGames.add(importedSummary('with-snapshot', 'pimported'));
    importedGames.add(importedSummary('screenshot', undefined, 'imported-screenshot?id=2'));

    const games = await collectStatsGames(gameLoader, importedGames, snapshots);

    expect(games.map((game) => [game.summary.id, game.resultUrl, game.details !== undefined])).deep.eq([
      ['with-snapshot', 'the-end?id=pimported', true],
      ['screenshot', 'imported-screenshot?id=2', false],
    ]);
  });
});
