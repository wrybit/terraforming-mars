import {RustAiSupport} from '../../../common/ai/RustAiSupport';
import {RustAiBlocker, RustAiSettings, isRustAiCompatible} from '../../../common/ai/isRustAiCompatible';

/** Text of one reason for the server log, e.g. "expansion venus". */
export function blockerText(blocker: RustAiBlocker): string {
  return blocker.kind + ' ' + blocker.id;
}

/**
 * Turns the new AI seats into classic AI seats when the new AI cannot play these settings.
 *
 * Covers requests that bypass the create form. Returns the reasons, empty when nothing changed.
 */
export function fallBackToClassicAi(players: ReadonlyArray<{name: string, aiEngine: string | undefined}>,
  settings: RustAiSettings, support: RustAiSupport): Array<RustAiBlocker> {
  const rustPlayers = players.filter((player) => player.aiEngine === 'rust');
  if (rustPlayers.length === 0) {
    return [];
  }
  const {ok, reasons} = isRustAiCompatible(settings, support);
  if (ok) {
    return [];
  }
  rustPlayers.forEach((player) => player.aiEngine = undefined);
  console.log(`New AI cannot play ${reasons.map(blockerText).join(', ')}; ${rustPlayers.map((player) => player.name).join(', ')} play the classic AI`);
  return reasons;
}
