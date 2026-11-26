import {CardName} from '../../common/cards/CardName';
import {GameModule} from '../../common/cards/GameModule';
import {resolveCardName} from '../../common/cards/CardRenames';
import {ALL_MODULE_MANIFESTS} from './AllManifests';

let modules: Map<CardName, GameModule> | undefined;

/**
 * Expansion a card comes from (corporation, project, prelude or CEO card), undefined for an unknown name.
 * The server's lookup for the AI check of card lists (common/ai/aiSetupLimits.ts); the create form uses its card data.
 */
export function cardModuleOf(card: CardName): GameModule | undefined {
  if (modules === undefined) {
    modules = new Map();
    for (const manifest of ALL_MODULE_MANIFESTS) {
      for (const list of [manifest.corporationCards, manifest.projectCards, manifest.preludeCards, manifest.ceoCards]) {
        for (const name of Object.keys(list) as Array<CardName>) {
          // The first manifest naming a card owns it, like the card factory (createCard.ts)
          if (!modules.has(name)) {
            modules.set(name, manifest.module);
          }
        }
      }
    }
  }
  return modules.get(resolveCardName(card));
}
