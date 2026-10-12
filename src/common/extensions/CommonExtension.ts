// Optional game extensions live in src/extensions/<name>/ and are not part of every checkout: the game
// builds and runs without them. Each may provide extension.common.ts, extension.server.ts and
// extension.client.ts; src/tools/make_extensions.ts lists the ones present in src/genfiles/extensions*.ts.
import type {ServerSettingDefinition} from '../admin/serverSettings';

/** Part shared by server and client (e.g. the admin page). */
export type CommonExtension = {
  name: string,
  /** Extra rows of the admin settings page; a new group name appears as its own section */
  serverSettings?: ReadonlyArray<ServerSettingDefinition>,
};
