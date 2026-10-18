import {SpaceBonus} from '../../common/boards/SpaceBonus';
import {SpaceName} from '../../common/boards/SpaceName';
import {Space} from './Space';
import {BoardBuilder} from './BoardBuilder';
import {Random} from '../../common/utils/Random';
import {GameOptions} from '../game/GameOptions';
import {MarsBoard} from './MarsBoard';
import {CanAffordOptions, IPlayer} from '../IPlayer';
import {SpaceId} from '../../common/Types';

/**
 * Arrakis, the board of the Dune theme. Same rules and the same totals as Tharsis (61 spaces, 12 oceans,
 * 4 volcanic areas, one reserved capital space, 11 steel, 4 titanium, 6 cards, 38 plant bonuses), only arranged
 * along the geography of Arrakis. Plant bonuses on rock, ice and spice fields became heat ("water") or energy
 * ("moisture") 1:1, because nothing grows there. Tests compare the totals with Tharsis (tests/boards/ArrakisBoard.spec.ts).
 */
export class ArrakisBoard extends MarsBoard {
  public static newInstance(gameOptions: GameOptions, rng: Random): ArrakisBoard {
    const builder = new BoardBuilder(gameOptions, rng);

    const PLANT = SpaceBonus.PLANT;
    const STEEL = SpaceBonus.STEEL;
    const DRAW_CARD = SpaceBonus.DRAW_CARD;
    const TITANIUM = SpaceBonus.TITANIUM;
    const HEAT = SpaceBonus.HEAT;
    const ENERGY = SpaceBonus.ENERGY;

    // y=0: Tuono basin, Observatory mountain
    builder.row((r) => r.ocean().land(PLANT, PLANT).volcanic(DRAW_CARD).land(STEEL).ocean(TITANIUM, TITANIUM));
    // y=1: Sietch Tabr, Rim wall west
    builder.row((r) => r.land().land(STEEL).land().land(STEEL).volcanic(TITANIUM, ENERGY).ocean(HEAT, HEAT));
    // y=2: Shield wall north, Hagga basin, Carthag, Arrakeen (reserved like Noctis City)
    builder.row((r) => r.land(DRAW_CARD).land(PLANT).land().land(PLANT, PLANT).land(PLANT, PLANT)
      .land(PLANT, PLANT).doNotShuffleLastSpace().land());
    // y=3: Mount Idaho, Hole in the rock
    builder.row((r) => r.ocean(DRAW_CARD).land().volcanic(ENERGY, ENERGY).land().land(PLANT).land(ENERGY).land().land());
    // y=4: Wind pass, Polar sink, Shield wall
    builder.row((r) => r.ocean(DRAW_CARD, DRAW_CARD).ocean(HEAT, HEAT).land().land(PLANT, PLANT).land(PLANT, PLANT)
      .land(PLANT).land().volcanic(STEEL, STEEL).ocean(STEEL, STEEL));
    // y=5: False wall east, Red chasm
    builder.row((r) => r.ocean(HEAT).land().land(PLANT).land(PLANT).land().land(ENERGY).ocean(HEAT).land(STEEL, STEEL));
    // y=6: False wall west, Harg pass, Pasty mesa
    builder.row((r) => r.ocean(HEAT, HEAT).land().land(ENERGY).land(PLANT).land(DRAW_CARD).land().land(STEEL, STEEL));
    // y=7: Cielago depression, False wall south
    builder.row((r) => r.land().land().land().land(PLANT, PLANT).land().land());
    // y=8: southern ice
    builder.row((r) => r.land().ocean(HEAT, HEAT).ocean(HEAT).land(ENERGY).land(TITANIUM));

    const spaces = builder.build();
    return new ArrakisBoard(spaces);
  }

  /** Dune expansion, Shai-Hulud: the space under the worm takes no tile (dune/DuneExpansion.ts sets it) */
  public wormSpaceId: SpaceId | undefined = undefined;
  /** Dune expansion, Kanly: the war field of this generation, shown on the board */
  public warFieldSpaceId: SpaceId | undefined = undefined;

  public constructor(spaces: ReadonlyArray<Space>) {
    super(spaces, SpaceName.ARRAKEEN);
  }

  public override getAvailableSpacesOnLand(player: IPlayer, canAffordOptions?: CanAffordOptions, subjectToHazardAdjacency: boolean = true): ReadonlyArray<Space> {
    return super.getAvailableSpacesOnLand(player, canAffordOptions, subjectToHazardAdjacency).filter((space) => space.id !== this.wormSpaceId);
  }

  public override getAvailableSpacesForOcean(player: IPlayer): ReadonlyArray<Space> {
    return super.getAvailableSpacesForOcean(player).filter((space) => space.id !== this.wormSpaceId);
  }
}
