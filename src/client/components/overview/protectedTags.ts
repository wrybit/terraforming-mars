import {Tag} from '@/common/cards/Tag';
import {CardName} from '@/common/cards/CardName';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {InterfaceTagsType} from '@/client/components/overview/playerTagDetails';

/*
 * Natur-Tags, die Geschützte Habitate schützt.
 *
 * Die Spieler-Tabelle zeigt den Schutz an diesen Tags genauso wie am Pflanzenvorrat.
 */
const PROTECTED_HABITATS_TAGS: ReadonlyArray<InterfaceTagsType> = [Tag.PLANT, Tag.MICROBE, Tag.ANIMAL];

/* Liefert die Tags, die `player` durch ausliegende Karten geschützt hat. */
export function protectedTagsOf(player: PublicPlayerModel): ReadonlyArray<InterfaceTagsType> {
  const hasProtectedHabitats = player.tableau.some((card) => card.name === CardName.PROTECTED_HABITATS);
  return hasProtectedHabitats ? PROTECTED_HABITATS_TAGS : [];
}
