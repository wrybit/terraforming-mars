import {BoardBuilder} from './BoardBuilder';
import {Random} from '../../common/utils/Random';
import {GameOptions} from '../game/GameOptions';
import {Space} from './Space';
import {SpaceId} from '../../common/Types';
import {Arrakis61Board} from './Arrakis61Board';
import {ARRAKIS_91_ARRAKEEN, ARRAKIS_91_ROWS} from './arrakis91Spaces';
import {buildArrakisRows} from './arrakisRows';
import {ARRAKIS_91_LAYOUT} from '../../common/dune/arrakisLayout';
import {arrakisCoordinate, arrakisSpaceIds} from '../../common/dune/arrakisCoordinates';

/**
 * The large Arrakis (Jens, 19 Oct 2026): six spaces a side, 91 spaces like Amazonis Planitia, with the same global
 * parameters as the standard Arrakis. Built from the standard board at the same places on the planet, the totals grown
 * by 91 / 61 (scripts/make-arrakis-91.ts writes arrakis91Spaces.ts). Plays like the standard Arrakis otherwise:
 * the worm, the war field and every Dune module work on it (common/dune/arrakisLayout.ts).
 */
export class Arrakis91Board extends Arrakis61Board {
  public override readonly A9: Readonly<Partial<Record<SpaceId, string>>> = Object.fromEntries(
    arrakisSpaceIds(ARRAKIS_91_LAYOUT).map((id) => [id, arrakisCoordinate(ARRAKIS_91_LAYOUT, id)]));

  public static override newInstance(gameOptions: GameOptions, rng: Random): Arrakis91Board {
    const builder = new BoardBuilder(gameOptions, rng, ARRAKIS_91_LAYOUT.rowLengths);
    buildArrakisRows(builder, ARRAKIS_91_ROWS, ARRAKIS_91_ARRAKEEN);
    return new Arrakis91Board(builder.build());
  }

  public constructor(spaces: ReadonlyArray<Space>) {
    super(spaces, ARRAKIS_91_ARRAKEEN as SpaceId, ARRAKIS_91_LAYOUT);
  }
}
