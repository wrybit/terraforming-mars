import {Color} from '../Color';
import {TileType} from '../TileType';
import {SpaceBonus} from '../boards/SpaceBonus';
import {SpaceType} from '../boards/SpaceType';
import {SpaceId} from '../Types';
import {UndergroundResourceToken} from '../underworld/UndergroundResourceToken';
import {SpaceCube} from '../boards/SpaceCube';

export type SpaceHighlight = undefined | 'noctis' | 'volcanic';

export type SpaceModel = {
  id: SpaceId;
  a9?: string;
  spaceType: SpaceType;
  bonus: Array<SpaceBonus>;
  color?: Color;
  tileType?: TileType;
  cube?: SpaceCube;
  highlight?: SpaceHighlight;
  rotated?: true; // Absent or true
  gagarin?: number; // 0 means current
  cathedral?: true; // Absent or true
  nomads?: true; // Absent or true
  coOwner?: Color;
  /** Dune expansion: the worm Shai-Hulud lies here (nothing may be placed) */
  worm?: true;
  /** Dune expansion: the war field of this generation's Kanly */
  warField?: true;

  undergroundResource?: UndergroundResourceToken;
  excavator?: Color;
}
