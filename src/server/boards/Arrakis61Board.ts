import {SpaceName} from '../../common/boards/SpaceName';
import {Space} from './Space';
import {BoardBuilder} from './BoardBuilder';
import {buildArrakisRows} from './arrakisRows';
import {ARRAKIS_61_ROWS} from './arrakis61Spaces';
import {Random} from '../../common/utils/Random';
import {GameOptions} from '../game/GameOptions';
import {MarsBoard} from './MarsBoard';
import {CanAffordOptions, IPlayer} from '../IPlayer';
import {SpaceId} from '../../common/Types';
import {ARRAKIS_LAYOUT, ArrakisLayout} from '../../common/dune/arrakisLayout';
import {GlobalParameterMaximums, getGlobalParameterMaximums} from '../../common/boards/GlobalParameterMaximums';

/**
 * Arrakis, the board of the Dune theme. Same rules and the same totals as Tharsis (61 spaces, 12 oceans,
 * 4 volcanic areas, one reserved capital space, 11 steel, 4 titanium, 6 cards, 38 plant bonuses), only arranged
 * along the geography of Arrakis: spice fields where the map shows spice, plant bonuses on rock, ice and spice fields
 * became heat ("water") or energy ("moisture") 1:1, because nothing grows there (scripts/make-arrakis-61.ts writes
 * arrakis61Spaces.ts). Tests compare the totals with Tharsis (tests/boards/Arrakis61Board.spec.ts).
 */
export class Arrakis61Board extends MarsBoard {
  public static newInstance(gameOptions: GameOptions, rng: Random): Arrakis61Board {
    const builder = new BoardBuilder(gameOptions, rng);
    buildArrakisRows(builder, ARRAKIS_61_ROWS, SpaceName.ARRAKEEN);
    const spaces = builder.build();
    return new Arrakis61Board(spaces);
  }

  /** Dune expansion, Shai-Hulud: the space under the worm takes no tile (dune/DuneExpansion.ts sets it) */
  public wormSpaceId: SpaceId | undefined = undefined;
  /** Dune expansion, Kanly: the war field of this generation, shown on the board */
  public warFieldSpaceId: SpaceId | undefined = undefined;

  /** Shape and terrain of this board (the large Arrakis has its own, Arrakis91Board.ts) */
  public readonly layout: ArrakisLayout;

  public constructor(spaces: ReadonlyArray<Space>, arrakeen: SpaceId = SpaceName.ARRAKEEN, layout: ArrakisLayout = ARRAKIS_LAYOUT,
    max: Readonly<GlobalParameterMaximums> = getGlobalParameterMaximums(layout.board)) {
    super(spaces, arrakeen, max);
    this.layout = layout;
  }

  public override getAvailableSpacesOnLand(player: IPlayer, canAffordOptions?: CanAffordOptions, subjectToHazardAdjacency: boolean = true): ReadonlyArray<Space> {
    return super.getAvailableSpacesOnLand(player, canAffordOptions, subjectToHazardAdjacency).filter((space) => space.id !== this.wormSpaceId);
  }

  public override getAvailableSpacesForOcean(player: IPlayer): ReadonlyArray<Space> {
    return super.getAvailableSpacesForOcean(player).filter((space) => space.id !== this.wormSpaceId);
  }
}
