import {AdminGameSummary} from '../../common/admin/AdminGameSummary';
import {toAdminPlayerSummaries} from '../../common/admin/adminPlayerSummaries';
import {LogMessage} from '../../common/logs/LogMessage';
import {ViewModel} from '../../common/models/PlayerModel';
import {Phase} from '../../common/Phase';
import {paths} from '../../common/app/paths';
import {isImportableParticipantId} from './isImportableParticipantId';
import {ImportedSnapshot} from './ImportedSnapshotsStore';

// External servers only hand out one participant's view, not a complete game state.
// So this view is imported along with the log – enough to show the results page permanently on our own server,
// even after the external server has long deleted the game. It cannot be used to continue playing.

export type JsonFetcher = (url: string) => Promise<unknown>;

export type ImportedGame = {
  summary: AdminGameSummary;
  snapshot: ImportedSnapshot;
};

const requestTimeoutMs = 15_000;

// Public main server – a bare ID (p…/s…) without a link refers to it
export const defaultExternalServer = 'https://terraforming-mars.herokuapp.com';

/** Expands a bare participant ID into a link to the public main server; links stay unchanged. */
export function toExternalLink(input: string): string {
  const trimmed = input.trim();
  return isImportableParticipantId(trimmed) ? `${defaultExternalServer}/${paths.THE_END}?id=${trimmed}` : trimmed;
}

/** Splits links like .../the-end?id=p…, .../player?id=p… or .../spectator?id=s… into server base and participant ID. */
export function parseExternalLink(link: string): {baseUrl: string, participantId: string, host: string} {
  let parsed: URL;
  try {
    parsed = new URL(link);
  } catch {
    throw new Error('Not a valid link');
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error('Only http and https links can be imported');
  }
  const participantId = parsed.searchParams.get('id') ?? '';
  if (!isImportableParticipantId(participantId)) {
    throw new Error('The link needs a player id (p…) or spectator id (s…)');
  }
  // The path before the last page is kept so servers under a subfolder work too
  const baseUrl = parsed.origin + parsed.pathname.replace(/[^/]*$/, '');
  return {baseUrl, participantId, host: parsed.host};
}

export async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, {signal: AbortSignal.timeout(requestTimeoutMs)});
  if (!response.ok) {
    throw new Error(`The other server answered with status ${response.status}`);
  }
  return response.json();
}

export async function importExternalGame(input: string, fetcher: JsonFetcher = fetchJson, now: () => number = Date.now): Promise<ImportedGame> {
  const link = toExternalLink(input);
  const {baseUrl, participantId, host} = parseExternalLink(link);
  const isSpectator = participantId.startsWith('s');
  const viewPath = isSpectator ? paths.API_SPECTATOR : paths.API_PLAYER;
  const view = await fetcher(`${baseUrl}${viewPath}?id=${participantId}`) as ViewModel;
  if (view?.game === undefined || !Array.isArray(view.players)) {
    throw new Error('The other server did not return a game');
  }

  // The results page loads the log generation by generation – so store each generation separately
  const logsByGeneration: Record<number, Array<LogMessage>> = {};
  for (let generation = 1; generation <= view.game.generation; generation++) {
    logsByGeneration[generation] = await fetcher(`${baseUrl}${paths.API_GAME_LOGS}?id=${participantId}&generation=${generation}`) as Array<LogMessage>;
  }

  // Afterwards the results page lives on this server under the same participant ID
  const localUrl = `${paths.THE_END}?id=${participantId}`;
  const isFinished = view.game.phase === Phase.END;
  const scores = view.players.map((player) => ({
    name: player.name,
    color: player.color,
    // Only the imported participant has a known link; the external server does not hand out the others' IDs
    url: !isSpectator && player.color === view.color ? localUrl : undefined,
    victoryPoints: player.victoryPointsBreakdown?.total ?? 0,
    megaCredits: player.megacredits ?? 0,
    // In the external view the corporation is only a card in the tableau – dispensable for the overview
    corporation: undefined,
  }));
  const summary: AdminGameSummary = {
    id: `import-${host}-${participantId}`,
    source: 'imported',
    createdTimeMs: now(),
    isFinished,
    generation: view.game.generation,
    // "Watch" in the overview opens the results page stored here
    spectatorUrl: localUrl,
    externalUrl: link,
    importedParticipantId: participantId,
    screenshotUrl: undefined,
    players: toAdminPlayerSummaries(scores, isFinished, view.game.isSoloModeWin === true),
  };
  return {summary, snapshot: {participantId, view, logsByGeneration}};
}
