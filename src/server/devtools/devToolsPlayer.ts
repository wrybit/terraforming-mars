// DevTools: rating, points, tags and discounts of one player (common/devtools/devToolsAction.ts DevToolsPlayerAction).
// Tags and points come as the totals the player bars should show; what the cards give stays, the DevTools add the rest.
import {IPlayer} from '../IPlayer';
import {Tag} from '../../common/cards/Tag';
import {DevToolsPlayerAction} from '../../common/devtools/devToolsAction';

function shownTagCount(player: IPlayer, tag: Tag): number {
  return player.tags.countAllTags()[tag];
}

export function applyPlayer(player: IPlayer, action: DevToolsPlayerAction): void {
  const state = player.devTools;
  if (action.terraformRating !== undefined) {
    player.setTerraformRating(Math.max(0, action.terraformRating));
  }
  for (const [tag, wanted] of Object.entries(action.tags ?? {}) as Array<[Tag, number]>) {
    // Never below the printed tags: the DevTools only add
    const printed = shownTagCount(player, tag) - (state.extraTags[tag] ?? 0);
    const extra = Math.max(0, wanted - printed);
    if (extra === 0) {
      delete state.extraTags[tag];
    } else {
      state.extraTags[tag] = extra;
    }
  }
  for (const [tag, amount] of Object.entries(action.tagDiscounts ?? {}) as Array<[Tag, number]>) {
    if (amount <= 0) {
      delete state.tagDiscounts[tag];
    } else {
      state.tagDiscounts[tag] = amount;
    }
  }
  // The bars show the discount for every card together with the one of colonies: the DevTools give what is missing
  if (action.cardDiscount !== undefined) {
    state.cardDiscount = Math.max(0, action.cardDiscount - player.colonies.cardDiscount);
  }
  if (action.protectedHabitats !== undefined) {
    state.protectedHabitats = action.protectedHabitats;
  }
  if (action.steelValue !== undefined) {
    player.setSteelValue(action.steelValue);
  }
  if (action.titaniumValue !== undefined) {
    player.setTitaniumValue(action.titaniumValue);
  }
  // Last, after rating and tags: those change the points as well
  if (action.victoryPoints !== undefined) {
    const withoutDevTools = player.getVictoryPoints().total - state.victoryPoints;
    state.victoryPoints = action.victoryPoints - withoutDevTools;
  }
  player.game.log('🛠 DevTools: rating, points, tags and discounts of ${0} set', (b) => b.player(player));
}
