import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {CardName} from '@/common/cards/CardName';
import {CardType} from '@/common/cards/CardType';
import {getCard} from '@/client/cards/ClientCardManifest';

// A player's corporations (several with Merger) – for the player bar (PlayerInfo) and table (PlayersTableRow)
export function corporationNames(player: PublicPlayerModel): Array<CardName> {
  return player.tableau
    .filter((card) => getCard(card.name)?.type === CardType.CORPORATION)
    .map((card) => card.name);
}
