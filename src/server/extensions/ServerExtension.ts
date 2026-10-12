// Server part of an optional extension (see src/common/extensions/CommonExtension.ts).
import {IHandler} from '../routes/IHandler';

export type ServerExtension = {
  name: string,
  /** Extra routes: path (as in paths.ts, without leading slash) → handler */
  routes?: ReadonlyArray<readonly [string, IHandler]>,
};
