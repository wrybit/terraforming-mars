import {expect} from 'chai';
import {testGame} from '../TestGame';
import {BoardName} from '../../src/common/boards/BoardName';
import {RandomMAOptionType} from '../../src/common/ma/RandomMAOptionType';
import {DEFAULT_GAME_OPTIONS} from '../../src/server/game/GameOptions';
import {chooseMilestonesAndAwards, getCandidates} from '../../src/server/ma/MilestoneAwardSelector';
import {milestoneManifest} from '../../src/server/milestones/Milestones';
import {awardManifest} from '../../src/server/awards/Awards';
import {
  ALL_DUNE_AWARDS, ALL_DUNE_MILESTONES, DUNE_GOALS_AWARDS, DUNE_GOALS_MILESTONES,
  DUNE_MODULE_MILESTONES, DUNE_ONLY_AWARDS, DUNE_ONLY_MILESTONES,
} from '../../src/common/dune/duneGoals';
import {DUNE_MODULES} from '../../src/common/dune/DuneModule';
import {BazaarRegular} from '../../src/server/dune/goals/BazaarRegular';
import {ChoamPartner} from '../../src/server/dune/goals/ChoamPartner';
import {SmugglerKing} from '../../src/server/dune/goals/SmugglerKing';
import {SpiceLord} from '../../src/server/dune/goals/SpiceLord';
import {WindtrapMagnate} from '../../src/server/dune/goals/WindtrapMagnate';
import {Resource} from '../../src/common/Resource';

describe('Dune goals (module "goals" and module milestones)', () => {
  it('every Dune module except goals brings exactly one milestone', () => {
    const withMilestone = DUNE_MODULES.filter((m) => m !== 'goals');
    expect(Object.keys(DUNE_MODULE_MILESTONES).sort()).deep.eq([...withMilestone].sort());
  });

  it('all Dune names exist in the manifests', () => {
    for (const name of ALL_DUNE_MILESTONES) {
      expect(milestoneManifest.all[name], name).is.not.undefined;
    }
    for (const name of ALL_DUNE_AWARDS) {
      expect(awardManifest.all[name], name).is.not.undefined;
    }
  });

  it('candidates follow the active modules', () => {
    const base = {...DEFAULT_GAME_OPTIONS, theme: 'dune' as const, boardName: BoardName.ARRAKIS_61};
    const [msNone, awNone] = getCandidates({...base, duneModules: []});
    expect(msNone).not.include('Spice Lord');
    expect(msNone).not.include('Bazaar Regular');
    expect(awNone).not.include('Windtrap Magnate');

    const [ms, aw] = getCandidates({...base, duneModules: ['goals', 'bazaar', 'choam']});
    expect(ms).include.members([...DUNE_GOALS_MILESTONES, 'Bazaar Regular', 'CHOAM Partner']);
    expect(ms).not.include('Smuggler King');
    expect(aw).include.members(DUNE_GOALS_AWARDS);
  });

  it('random draw in Dune always succeeds and only uses candidates', () => {
    const options = {
      ...DEFAULT_GAME_OPTIONS, theme: 'dune' as const, boardName: BoardName.ARRAKIS_91,
      randomMA: RandomMAOptionType.LIMITED, duneModules: [...DUNE_MODULES],
    };
    const [ms, aw] = getCandidates(options);
    for (let i = 0; i < 30; i++) {
      const drawn = chooseMilestonesAndAwards(options);
      expect(drawn.milestones).has.length(5);
      expect(drawn.awards).has.length(5);
      expect(ms).include.members(drawn.milestones);
      expect(aw).include.members(drawn.awards);
    }
  });

  it('Mars never draws Dune-only goals', () => {
    const [ms, aw] = getCandidates({...DEFAULT_GAME_OPTIONS, randomMA: RandomMAOptionType.UNLIMITED});
    for (const name of DUNE_ONLY_MILESTONES) {
      expect(ms).not.include(name);
    }
    for (const name of DUNE_ONLY_AWARDS) {
      expect(aw).not.include(name);
    }
  });

  it('counters drive the module milestones', () => {
    const [game, player, other] = testGame(2, {theme: 'dune', boardName: BoardName.ARRAKIS_61, duneModules: ['bazaar', 'choam', 'smuggling']});
    const data = game.duneData!;
    expect(new BazaarRegular().getScore(player)).eq(0);
    data.bazaar!.purchases = {[player.id]: 3};
    expect(new BazaarRegular().canClaim(player)).is.true;
    data.choam!.deals = {[player.id]: 2};
    expect(new ChoamPartner().canClaim(player)).is.true;
    expect(new ChoamPartner().canClaim(other)).is.false;
    data.smuggling!.deals = {[player.id]: 2};
    expect(new SmugglerKing().canClaim(player)).is.false;
  });

  it('Spice Lord and Windtrap Magnate', () => {
    const [/* game */, player, other] = testGame(2, {theme: 'dune', boardName: BoardName.ARRAKIS_61});
    player.production.add(Resource.TITANIUM, 3);
    expect(new SpiceLord().canClaim(player)).is.true;
    player.production.add(Resource.ENERGY, 2);
    other.production.add(Resource.ENERGY, 1);
    expect(new WindtrapMagnate().getScore(player)).eq(2);
  });
});
