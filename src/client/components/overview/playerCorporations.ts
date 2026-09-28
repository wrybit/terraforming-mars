import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {CardName} from '@/common/cards/CardName';
import {CardType} from '@/common/cards/CardType';
import {getCard} from '@/client/cards/ClientCardManifest';

// Konzerne eines Spielers (bei Merger auch mehrere) – für Spielerleiste (PlayerInfo) und Tabelle (PlayersTableRow)
export function corporationNames(player: PublicPlayerModel): Array<CardName> {
  return player.tableau
    .filter((card) => getCard(card.name)?.type === CardType.CORPORATION)
    .map((card) => card.name);
}
