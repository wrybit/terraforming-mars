import {Tag} from '@/common/cards/Tag';
import {CardName} from '@/common/cards/CardName';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {InterfaceTagsType} from '@/client/components/overview/playerTagDetails';

// Tags, die ein Spieler geschützt hat. Geschützte Habitate schützt Pflanzen, Mikroben und Tiere;
// die Spieler-Tabelle zeigt das an den drei Natur-Tags genauso wie am Pflanzenvorrat
const PROTECTED_HABITATS_TAGS: ReadonlyArray<InterfaceTagsType> = [Tag.PLANT, Tag.MICROBE, Tag.ANIMAL];

export function protectedTagsOf(player: PublicPlayerModel): ReadonlyArray<InterfaceTagsType> {
  const hasProtectedHabitats = player.tableau.some((card) => card.name === CardName.PROTECTED_HABITATS);
  return hasProtectedHabitats ? PROTECTED_HABITATS_TAGS : [];
}
