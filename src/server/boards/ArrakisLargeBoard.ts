import {BoardBuilder} from './BoardBuilder';
import {Random} from '../../common/utils/Random';
import {GameOptions} from '../game/GameOptions';
import {Space} from './Space';
import {SpaceId} from '../../common/Types';
import {ArrakisBoard} from './ArrakisBoard';
import {ARRAKIS_LARGE_ARRAKEEN, ARRAKIS_LARGE_ROWS} from './arrakisLargeSpaces';
import {ARRAKIS_LARGE_LAYOUT} from '../../common/dune/arrakisLayout';
import {arrakisCoordinate, arrakisSpaceIds} from '../../common/dune/arrakisCoordinates';

/**
 * The large Arrakis (Jens, 19 Oct 2026): six spaces a side, 91 spaces like Amazonis Planitia, with the same global
 * parameters as the standard Arrakis. Built from the standard board at the same places on the planet, the totals grown
 * by 91 / 61 (scripts/make-arrakis-large.ts writes arrakisLargeSpaces.ts). Plays like the standard Arrakis otherwise:
 * the worm, the war field and every Dune module work on it (common/dune/arrakisLayout.ts).
 */
export class ArrakisLargeBoard extends ArrakisBoard {
  public override readonly A9: Readonly<Partial<Record<SpaceId, string>>> = Object.fromEntries(
    arrakisSpaceIds(ARRAKIS_LARGE_LAYOUT).map((id) => [id, arrakisCoordinate(ARRAKIS_LARGE_LAYOUT, id)]));

  public static override newInstance(gameOptions: GameOptions, rng: Random): ArrakisLargeBoard {
    const builder = new BoardBuilder(gameOptions, rng, ARRAKIS_LARGE_LAYOUT.rowLengths);
    let spaceNumber = 3;
    for (const row of ARRAKIS_LARGE_ROWS) {
      builder.row((r) => {
        for (const space of row) {
          r[space.kind](...space.bonus);
          // Arrakeen stays where it is when the bonuses are shuffled, like Noctis City
          if (spaceNumber === Number(ARRAKIS_LARGE_ARRAKEEN)) {
            r.doNotShuffleLastSpace();
          }
          spaceNumber++;
        }
      });
    }
    return new ArrakisLargeBoard(builder.build());
  }

  public constructor(spaces: ReadonlyArray<Space>) {
    super(spaces, ARRAKIS_LARGE_ARRAKEEN as SpaceId, ARRAKIS_LARGE_LAYOUT);
  }
}
