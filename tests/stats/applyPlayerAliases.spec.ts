import {expect} from 'chai';
import {applyPlayerAliases} from '../../src/server/stats/applyPlayerAliases';
import {StatsGame} from '../../src/common/stats/StatsGame';
import {MilestoneName} from '../../src/common/ma/MilestoneName';
import {AwardName} from '../../src/common/ma/AwardName';

function game(): StatsGame {
  return {
    summary: {
      id: 'g', source: 'local', createdTimeMs: 0, isFinished: true, generation: 10, spectatorUrl: undefined,
      externalUrl: undefined, importedParticipantId: undefined, screenshotUrl: undefined,
      players: [{name: 'jens', color: 'red', url: undefined, victoryPoints: 80, megaCredits: 0, isWinner: true, corporation: undefined}],
    },
    resultUrl: undefined,
    details: {
      source: 'game', cardsComplete: true, boardName: undefined, expansions: [],
      players: [{name: 'jens', cards: []}],
      milestones: [{name: 'Terraformer' as MilestoneName, playerName: 'jens'}],
      awards: [{name: 'Banker' as AwardName, funderName: 'jens', winnerNames: ['jens'], secondNames: ['Tobi']}],
      tiles: [{spaceId: '03', type: 'city', playerName: 'jens'}],
    },
  };
}

describe('applyPlayerAliases', () => {
  it('renames every player name of a game', () => {
    const [renamed] = applyPlayerAliases([game()], new Map([['jens', 'Jens']]));
    expect(renamed.summary.players[0].name).eq('Jens');
    expect(renamed.details?.players[0].name).eq('Jens');
    expect(renamed.details?.milestones[0].playerName).eq('Jens');
    expect(renamed.details?.awards[0]).deep.include({funderName: 'Jens', winnerNames: ['Jens'], secondNames: ['Tobi']});
    expect(renamed.details?.tiles?.[0].playerName).eq('Jens');
  });

  it('leaves the original game untouched (it stays cached)', () => {
    const original = game();
    applyPlayerAliases([original], new Map([['jens', 'Jens']]));
    expect(original.summary.players[0].name).eq('jens');
    expect(original.details?.players[0].name).eq('jens');
  });
});
