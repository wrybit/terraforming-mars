import {expect} from 'chai';
import {testGame} from './TestGame';

// Die Lösch-Warnung muss zur tatsächlichen Datenbank passen, sonst warnt sie vor einer Löschung, die nie stattfindet.
describe('Game.expectedPurgeTimeMs', () => {
  const variableNames = ['MAX_GAME_DAYS', 'POSTGRES_HOST', 'LOCAL_FS_DB'] as const;
  let savedValues: Record<string, string | undefined>;
  const dayInMs = 24 * 60 * 60 * 1000;

  beforeEach(() => {
    savedValues = {};
    for (const name of variableNames) {
      savedValues[name] = process.env[name];
      delete process.env[name];
    }
  });

  afterEach(() => {
    for (const name of variableNames) {
      if (savedValues[name] === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = savedValues[name];
      }
    }
  });

  function purgeDays(): number {
    const [game] = testGame(1);
    const purgeTimeMs = game.expectedPurgeTimeMs();
    return purgeTimeMs === 0 ? 0 : Math.round((purgeTimeMs - game.createdTime.getTime()) / dayInMs);
  }

  it('SQLite without MAX_GAME_DAYS never purges', () => {
    expect(purgeDays()).eq(0);
  });

  it('SQLite with MAX_GAME_DAYS purges after that many days', () => {
    process.env.MAX_GAME_DAYS = '3';
    expect(purgeDays()).eq(3);
  });

  it('PostgreSQL without MAX_GAME_DAYS purges after 10 days', () => {
    process.env.POSTGRES_HOST = 'localhost';
    expect(purgeDays()).eq(10);
  });

  it('local filesystem never purges', () => {
    process.env.LOCAL_FS_DB = '1';
    process.env.MAX_GAME_DAYS = '3';
    expect(purgeDays()).eq(0);
  });
});
