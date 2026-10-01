import {AdminGameSummary} from '../../common/admin/AdminGameSummary';
import {toAdminPlayerSummaries} from '../../common/admin/adminPlayerSummaries';
import {ViewModel} from '../../common/models/PlayerModel';
import {Phase} from '../../common/Phase';
import {isPlayerId, isSpectatorId} from '../../common/Types';

// Fremde Server geben nur die Ansicht eines Teilnehmers heraus, keinen vollständigen Spielstand.
// Importiert wird deshalb das Ergebnis (Spieler, Punkte, Sieger, Generation), nicht eine spielbare Partie.

export type JsonFetcher = (url: string) => Promise<unknown>;

const requestTimeoutMs = 15_000;

// Öffentlicher Hauptserver – eine nackte ID (p…/s…) ohne Link bezieht sich auf ihn
export const defaultExternalServer = 'https://terraforming-mars.herokuapp.com';

/** Ergänzt eine nackte Teilnehmer-ID zum Link auf den öffentlichen Hauptserver; Links bleiben unverändert. */
export function toExternalLink(input: string): string {
  const trimmed = input.trim();
  if (isPlayerId(trimmed)) {
    return `${defaultExternalServer}/the-end?id=${trimmed}`;
  }
  if (isSpectatorId(trimmed)) {
    return `${defaultExternalServer}/spectator?id=${trimmed}`;
  }
  return trimmed;
}

/** Wandelt Links wie .../the-end?id=p…, .../player?id=p… oder .../spectator?id=s… in den passenden API-Aufruf um. */
export function toExternalApiUrl(link: string): {apiUrl: string, participantId: string, host: string} {
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
  // Der Pfad vor der letzten Seite bleibt erhalten, damit auch Server unter einem Unterordner funktionieren
  const basePath = parsed.pathname.replace(/[^/]*$/, '');
  if (isPlayerId(participantId)) {
    return {apiUrl: `${parsed.origin}${basePath}api/player?id=${participantId}`, participantId, host: parsed.host};
  }
  if (isSpectatorId(participantId)) {
    return {apiUrl: `${parsed.origin}${basePath}api/spectator?id=${participantId}`, participantId, host: parsed.host};
  }
  throw new Error('The link needs a player id (p…) or spectator id (s…)');
}

export async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, {signal: AbortSignal.timeout(requestTimeoutMs)});
  if (!response.ok) {
    throw new Error(`The other server answered with status ${response.status}`);
  }
  return response.json();
}

export async function importExternalGame(input: string, fetcher: JsonFetcher = fetchJson, now: () => number = Date.now): Promise<AdminGameSummary> {
  const link = toExternalLink(input);
  const {apiUrl, participantId, host} = toExternalApiUrl(link);
  const view = await fetcher(apiUrl) as Partial<ViewModel>;
  if (view?.game === undefined || !Array.isArray(view.players)) {
    throw new Error('The other server did not return a game');
  }
  const isFinished = view.game.phase === Phase.END;
  const scores = view.players.map((player) => ({
    name: player.name,
    color: player.color,
    // Nur der importierte Teilnehmer hat einen bekannten Link; die IDs der anderen gibt der fremde Server nicht heraus
    url: player.color === view.color ? link : undefined,
    victoryPoints: player.victoryPointsBreakdown?.total ?? 0,
    megaCredits: player.megacredits ?? 0,
  }));
  return {
    id: `import-${host}-${participantId}`,
    source: 'imported',
    createdTimeMs: now(),
    isFinished,
    generation: view.game.generation,
    spectatorUrl: isSpectatorId(participantId) ? link : undefined,
    externalUrl: link,
    players: toAdminPlayerSummaries(scores, isFinished, view.game.isSoloModeWin === true),
  };
}
