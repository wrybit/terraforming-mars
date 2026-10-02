import {Tag} from '@/common/cards/Tag';
import {CardName} from '@/common/cards/CardName';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {InterfaceTagsType} from '@/client/components/overview/playerTagDetails';

/*
 * Nature tags that Protected Habitats protects.
 *
 * The player table shows the protection on these tags just like on the plant stock.
 */
const PROTECTED_HABITATS_TAGS: ReadonlyArray<InterfaceTagsType> = [Tag.PLANT, Tag.MICROBE, Tag.ANIMAL];

/* Returns the tags that `player` has protected through cards in play. */
export function protectedTagsOf(player: PublicPlayerModel): ReadonlyArray<InterfaceTagsType> {
  const hasProtectedHabitats = player.tableau.some((card) => card.name === CardName.PROTECTED_HABITATS);
  return hasProtectedHabitats ? PROTECTED_HABITATS_TAGS : [];
}
