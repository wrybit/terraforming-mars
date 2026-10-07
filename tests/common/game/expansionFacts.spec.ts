import {expect} from 'chai';
import {EXPANSION_FACTS} from '../../../src/common/game/expansionFacts';
import {GAME_MODULES, GameModule} from '../../../src/common/cards/GameModule';
import {milestoneManifest} from '../../../src/server/milestones/Milestones';
import {awardManifest} from '../../../src/server/awards/Awards';
import {ALL_MODULE_MANIFESTS} from '../../../src/server/cards/AllManifests';
import {BASE_COLONIES_TILES, COMMUNITY_COLONIES_TILES, PATHFINDERS_COLONIES_TILES} from '../../../src/server/colonies/ColonyManifest';

// The "Create game" page shows these numbers per expansion; they must match what the server deals.
describe('expansionFacts', () => {
  function compatibilityCount(all: Record<string, {compatibility?: string}>, module: GameModule): number {
    return Object.values(all).filter((spec) => spec.compatibility === module).length;
  }

  for (const module of GAME_MODULES) {
    it(`${module}: milestones and awards match the manifests`, () => {
      const facts = EXPANSION_FACTS[module] ?? {};
      expect(facts.milestone ?? 0).eq(compatibilityCount(milestoneManifest.all, module));
      expect(facts.award ?? 0).eq(compatibilityCount(awardManifest.all, module));
    });

    it(`${module}: global events match the module manifest`, () => {
      const manifest = ALL_MODULE_MANIFESTS.find((m) => m.module === module);
      expect(EXPANSION_FACTS[module]?.globalEvent ?? 0).eq(Object.keys(manifest?.globalEvents ?? {}).length);
    });
  }

  it('colony tiles match the colony manifest', () => {
    expect(EXPANSION_FACTS.colonies?.colonyTile).eq(BASE_COLONIES_TILES.length);
    expect(EXPANSION_FACTS.community?.colonyTile).eq(COMMUNITY_COLONIES_TILES.length);
    expect(EXPANSION_FACTS.pathfinders?.colonyTile).eq(PATHFINDERS_COLONIES_TILES.length);
  });

  it('names the kind of tiles exactly for modules with new tiles', () => {
    for (const module of GAME_MODULES) {
      const facts = EXPANSION_FACTS[module] ?? {};
      expect(facts.tiles !== undefined, module).eq(facts.traits?.includes('newTiles') ?? false);
    }
  });
});
