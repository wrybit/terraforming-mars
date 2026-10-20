import {BoardBuilder} from './BoardBuilder';
import {SpaceBonus} from '../../common/boards/SpaceBonus';

/** One Arrakis space as the board generators write it (scripts/make-arrakis-61.ts, scripts/make-arrakis-91.ts) */
export type ArrakisSpaceDefinition = {kind: 'ocean' | 'land' | 'volcanic', bonus: Array<SpaceBonus>};

/**
 * Builds the rows of an Arrakis board, space ids from 03 in reading order. Arrakeen stays where it is when the
 * bonuses are shuffled, like Noctis City. Shared by both Arrakis boards, so they build the same way.
 */
export function buildArrakisRows(builder: BoardBuilder, rows: ReadonlyArray<ReadonlyArray<ArrakisSpaceDefinition>>, arrakeen: string): void {
  let spaceNumber = 3;
  for (const row of rows) {
    builder.row((r) => {
      for (const space of row) {
        r[space.kind](...space.bonus);
        if (spaceNumber === Number(arrakeen)) {
          r.doNotShuffleLastSpace();
        }
        spaceNumber++;
      }
    });
  }
}
