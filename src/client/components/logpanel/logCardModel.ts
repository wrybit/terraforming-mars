import {CardName} from '@/common/cards/CardName';
import {CardModel} from '@/common/models/CardModel';
import {PublicPlayerModel} from '@/common/models/PlayerModel';

// Karte aus einer Log-Zeile mit dem, was gerade auf ihr liegt (Ressourcen, Selbstreplizierende Roboter),
// damit die Anzeige dem Spielstand entspricht (CardPanel, LogCardsZoom)

function isSelfReplicatingRobotsCard(name: CardName, players: ReadonlyArray<PublicPlayerModel>): boolean {
  return players.some((player) => player.selfReplicatingRobotsCards.some((card) => card.name === name));
}

function resourcesOnCard(name: CardName, players: ReadonlyArray<PublicPlayerModel>): number | undefined {
  for (const player of players) {
    const playedCard = player.tableau.find((card) => card.name === name) ??
      player.selfReplicatingRobotsCards.find((card) => card.name === name);
    if (playedCard !== undefined) {
      return playedCard.resources;
    }
  }
  return undefined;
}

export function logCardModel(name: CardName, players: ReadonlyArray<PublicPlayerModel>): CardModel {
  return {
    name,
    isSelfReplicatingRobotsCard: isSelfReplicatingRobotsCard(name, players),
    resources: resourcesOnCard(name, players),
  } as CardModel;
}
