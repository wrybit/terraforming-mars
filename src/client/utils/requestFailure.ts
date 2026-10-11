import {translateText, translateTextWithParams} from '@/client/directives/i18n';

// Fehlermeldungen sollen sagen, WAS schiefging, WARUM und WAS man tun kann – nicht nur "ging nicht".
// Dieses Modul haelt die Ursache eines fehlgeschlagenen Server-Aufrufs fest (keine Verbindung oder
// HTTP-Status samt Server-Text) und formuliert sie einheitlich fuer alle Meldungen.

export type RequestFailure =
  | {kind: 'network'}
  | {kind: 'http', status: number, serverText: string};

const MAX_SERVER_TEXT_LENGTH = 300;

export class RequestFailedError extends Error {
  constructor(public readonly failure: RequestFailure) {
    super(failure.kind === 'network' ? 'No connection to the server' : `HTTP ${failure.status}: ${failure.serverText}`);
  }
}

export async function failureFromResponse(response: Response): Promise<RequestFailure> {
  let serverText = '';
  try {
    serverText = (await response.text()).trim();
  } catch {
    // Kein lesbarer Text – dann bleibt nur der Status
  }
  // JSON-Fehlerantworten (AppErrorResponse) auf die eigentliche Meldung reduzieren
  try {
    const parsed = JSON.parse(serverText);
    if (typeof parsed?.message === 'string') {
      serverText = parsed.message;
    }
  } catch {
    // Kein JSON: Text unveraendert lassen
  }
  return {kind: 'http', status: response.status, serverText: serverText.slice(0, MAX_SERVER_TEXT_LENGTH)};
}

/** fetch, das bei Netzwerkfehler oder HTTP-Fehler einen RequestFailedError mit Ursache wirft. */
export async function fetchOrFail(input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(input, init);
  } catch {
    throw new RequestFailedError({kind: 'network'});
  }
  if (!response.ok) {
    throw new RequestFailedError(await failureFromResponse(response));
  }
  return response;
}

/** Ursache aus einem beliebigen gefangenen Fehler; fetch meldet fehlende Verbindung als TypeError. */
export function failureOf(err: unknown): RequestFailure {
  if (err instanceof RequestFailedError) {
    return err.failure;
  }
  if (err instanceof TypeError) {
    return {kind: 'network'};
  }
  return {kind: 'http', status: 0, serverText: err instanceof Error ? err.message : String(err)};
}

/** Ursache und naechster Schritt, uebersetzt; fuer den Text hinter "… konnte nicht geladen werden." */
export function describeFailure(failure: RequestFailure): string {
  if (failure.kind === 'network') {
    return translateText('No connection to the server. Check the internet connection and reload the page. If that does not help, the server may be restarting or switched off.');
  }
  const serverText = failure.serverText === '' ? translateText('(no details from the server)') : translateText(failure.serverText);
  if (failure.status === 0) {
    return translateTextWithParams('Unexpected answer from the server: ${0}', [serverText]);
  }
  if (failure.status >= 500) {
    return translateTextWithParams('The server reported an internal error (HTTP ${0}): ${1}. Reload the page. If it happens again, send this message to the server admin.', [String(failure.status), serverText]);
  }
  return translateTextWithParams('The server answered with HTTP ${0}: ${1}', [String(failure.status), serverText]);
}
