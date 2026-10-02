import {AdminGameSummary} from '../../common/admin/AdminGameSummary';
import {toAdminPlayerSummaries} from '../../common/admin/adminPlayerSummaries';
import {LogMessage} from '../../common/logs/LogMessage';
import {ViewModel} from '../../common/models/PlayerModel';
import {Phase} from '../../common/Phase';
import {paths} from '../../common/app/paths';
import {isImportableParticipantId} from './isImportableParticipantId';
import {ImportedSnapshot} from './ImportedSnapshotsStore';

// Fremde Server geben nur die Ansicht eines Teilnehmers heraus, keinen vollständigen Spielstand.
// Importiert wird deshalb diese Ansicht samt Log – genug, um die Ergebnisseite dauerhaft auf dem eigenen Server
// zu zeigen, auch wenn der fremde Server das Spiel längst gelöscht hat. Weiterspielen geht damit nicht.

export type JsonFetcher = (url: string) => Promise<unknown>;

export type ImportedGame = {
  summary: AdminGameSummary;
  snapshot: ImportedSnapshot;
};

const requestTimeoutMs = 15_000;

// Öffentlicher Hauptserver – eine nackte ID (p…/s…) ohne Link bezieht sich auf ihn
export const defaultExternalServer = 'https://terraforming-mars.herokuapp.com';

/** Ergänzt eine nackte Teilnehmer-ID zum Link auf den öffentlichen Hauptserver; Links bleiben unverändert. */
export function toExternalLink(input: string): string {
  const trimmed = input.trim();
  return isImportableParticipantId(trimmed) ? `${defaultExternalServer}/${paths.THE_END}?id=${trimmed}` : trimmed;
}

/** Zerlegt Links wie .../the-end?id=p…, .../player?id=p… oder .../spectator?id=s… in Server-Basis und Teilnehmer-ID. */
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
  // Der Pfad vor der letzten Seite bleibt erhalten, damit auch Server unter einem Unterordner funktionieren
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

  // Die Ergebnisseite lädt das Log generationsweise nach – deshalb jede Generation einzeln sichern
  const logsByGeneration: Record<number, Array<LogMessage>> = {};
  for (let generation = 1; generation <= view.game.generation; generation++) {
    logsByGeneration[generation] = await fetcher(`${baseUrl}${paths.API_GAME_LOGS}?id=${participantId}&generation=${generation}`) as Array<LogMessage>;
  }

  // Die Ergebnisseite liegt danach auf diesem Server unter derselben Teilnehmer-ID
  const localUrl = `${paths.THE_END}?id=${participantId}`;
  const isFinished = view.game.phase === Phase.END;
  const scores = view.players.map((player) => ({
    name: player.name,
    color: player.color,
    // Nur der importierte Teilnehmer hat einen bekannten Link; die IDs der anderen gibt der fremde Server nicht heraus
    url: !isSpectator && player.color === view.color ? localUrl : undefined,
    victoryPoints: player.victoryPointsBreakdown?.total ?? 0,
    megaCredits: player.megacredits ?? 0,
  }));
  const summary: AdminGameSummary = {
    id: `import-${host}-${participantId}`,
    source: 'imported',
    createdTimeMs: now(),
    isFinished,
    generation: view.game.generation,
    // "Watch" in der Übersicht öffnet die hier gespeicherte Ergebnisseite
    spectatorUrl: localUrl,
    externalUrl: link,
    importedParticipantId: participantId,
    players: toAdminPlayerSummaries(scores, isFinished, view.game.isSoloModeWin === true),
  };
  return {summary, snapshot: {participantId, view, logsByGeneration}};
}
