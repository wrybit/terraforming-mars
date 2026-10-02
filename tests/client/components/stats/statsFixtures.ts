import {StatsGame} from '@/common/stats/StatsGame';
import {CardName} from '@/common/cards/CardName';
import {BoardName} from '@/common/boards/BoardName';
import {Color} from '@/common/Color';

type PlayerSpec = {name: string, color: Color, points: number, corporation: string, cards?: Array<CardName>};

let counter = 0;

/** Beendete Partie; der Erste in der Liste mit den meisten Punkten gewinnt. */
export function statsGame(players: Array<PlayerSpec>, options: {generation?: number, board?: BoardName, details?: boolean, timeMs?: number} = {}): StatsGame {
  counter++;
  const best = Math.max(...players.map((player) => player.points));
  return {
    summary: {
      id: `g${counter}`,
      source: 'local',
      createdTimeMs: options.timeMs ?? Date.UTC(2026, 0, counter),
      isFinished: true,
      generation: options.generation ?? 10,
      spectatorUrl: undefined,
      externalUrl: undefined,
      importedParticipantId: undefined,
      screenshotUrl: undefined,
      players: players.map((player) => ({
        name: player.name, color: player.color, url: undefined, victoryPoints: player.points, megaCredits: 0,
        isWinner: player.points === best, corporation: player.corporation,
      })),
    },
    resultUrl: `the-end?id=p${counter}`,
    details: options.details === false ? undefined : {
      source: 'game',
      cardsComplete: true,
      boardName: options.board ?? BoardName.THARSIS,
      expansions: ['corpera', 'prelude'],
      players: players.map((player) => ({
        name: player.name, cards: player.cards ?? [], terraformRating: 30, greeneries: 3, cities: 2,
        cardPoints: (player.cards ?? []).includes(CardName.BIRDS) ? [{name: CardName.BIRDS, points: 4}] : [],
        victoryPoints: {terraformRating: 30, milestones: 5, awards: 5, greenery: 3, city: 4, cards: player.points - 47, other: 0, total: player.points},
        pointsByGeneration: [20, Math.round(player.points / 2), player.points],
        timeSeconds: 1800, actions: 90,
      })),
      milestones: [{name: 'Gardener', playerName: players[0].name}],
      awards: [{name: 'Landlord', funderName: players[1].name, winnerNames: [players[0].name]}],
      globalsByGeneration: {temperature: [0, 50, 100], oxygen: [0, 40, 100], oceans: [10, 60, 100]},
    },
  };
}

/** Drei Partien: zwei zu dritt, eine zu zweit, eine davon nur als Screenshot (ohne Details). */
export function sampleGames(): Array<StatsGame> {
  return [
    statsGame([
      {name: 'Jens', color: 'blue', points: 100, corporation: 'Ecoline', cards: [CardName.ECOLINE, CardName.DONATION, CardName.BIRDS]},
      {name: 'Daniel', color: 'red', points: 90, corporation: 'Helion', cards: [CardName.HELION, CardName.MOHOLE, CardName.ANTS]},
      {name: 'Martin', color: 'green', points: 80, corporation: 'Helion', cards: [CardName.HELION]},
    ], {generation: 11}),
    statsGame([
      {name: 'Daniel', color: 'red', points: 95, corporation: 'Ecoline', cards: [CardName.ECOLINE, CardName.BIRDS]},
      {name: 'Jens', color: 'blue', points: 70, corporation: 'Helion', cards: [CardName.HELION, CardName.DONATION]},
    ], {generation: 9, board: BoardName.HELLAS}),
    statsGame([
      {name: 'Martin', color: 'green', points: 120, corporation: 'Ecoline'},
      {name: 'Jens', color: 'blue', points: 60, corporation: 'Helion'},
      {name: 'Daniel', color: 'red', points: 50, corporation: 'Helion'},
    ], {generation: 12, details: false}),
  ];
}
