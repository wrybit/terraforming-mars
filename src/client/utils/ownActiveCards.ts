import {PlayerViewModel} from '@/common/models/PlayerModel';
import {CardModel} from '@/common/models/CardModel';
import {CardType} from '@/common/cards/CardType';
import {getCardsByType} from '@/client/utils/CardUtils';
import {sortActiveCards} from '@/client/utils/ActiveCardsSortingOrder';

// Eigene ausgespielte blaue Karten (Aktionen/Effekte) in derselben Reihenfolge wie in der Kartenansicht
// der Spielerleiste, damit man sie im Handkarten-Tab nicht erst im Modal suchen muss.
export function ownActiveCards(playerView: PlayerViewModel): ReadonlyArray<CardModel> {
  return sortActiveCards(getCardsByType(playerView.thisPlayer.tableau, [CardType.ACTIVE]));
}
