import {translateText, translateTextWithParams} from '@/client/directives/i18n';
import {paths} from '@/common/app/paths';
import {GameDeletionModel} from '@/common/models/GameDeletionModel';
import {describeFailure, failureOf} from '@/client/utils/requestFailure';

export type GameLoadFailureReport = {
  title: string,
  text: string,
  /** Partie gibt es nicht: OK fuehrt zur Startseite statt auf eine leere Seite */
  leadsToStartPage: boolean,
};

// Bei "Partie nicht gefunden" fragt der Client nach, ob sie geloescht wurde (api/game/deletion),
// damit die Meldung ID, Zeitpunkt und Grund nennen kann – und man weiss, ob ein Tippfehler im Link,
// ein falscher Server oder eine Loeschung dahintersteckt.
async function fetchDeletion(id: string): Promise<GameDeletionModel> {
  try {
    const response = await fetch(paths.API_GAME_DELETION + '?id=' + encodeURIComponent(id));
    return response.ok ? await response.json() : {deleted: false};
  } catch {
    return {deleted: false};
  }
}

function playersSentence(playerNames: ReadonlyArray<string>): string {
  return playerNames.length === 0 ? '' : '\n' + translateTextWithParams('Players: ${0}', [playerNames.join(', ')]);
}

export async function describeGameLoadFailure(id: string, err: unknown): Promise<GameLoadFailureReport> {
  const failure = failureOf(err);
  if (failure.kind === 'http' && failure.status === 404) {
    const deletion = await fetchDeletion(id);
    if (deletion.deleted) {
      const when = new Date(deletion.deletedAt).toLocaleString();
      const what = deletion.reason === 'purged-unfinished' ?
        translateTextWithParams('Game ${0} was removed automatically on ${1}: unfinished games are deleted after ${2} days.', [deletion.gameId, when, deletion.maxGameDays ?? '?']) :
        translateTextWithParams('Game ${0} was deleted in the admin area on ${1}.', [deletion.gameId, when]);
      return {
        title: translateText('Game deleted'),
        text: what + playersSentence(deletion.playerNames) + '\n' + translateText('Its data no longer exists on this server, so the link no longer works.'),
        leadsToStartPage: true,
      };
    }
    return {
      title: translateText('Game not found'),
      text: translateTextWithParams('This server (${0}) has no game with the ID ${1}, and none was deleted under this ID. Check the link: a character may be missing, or the game belongs to another server.', [window.location.host, id || '—']),
      leadsToStartPage: true,
    };
  }
  return {
    title: translateText('Game could not be loaded'),
    text: translateTextWithParams('Game ${0} could not be loaded.', [id || '—']) + '\n' + describeFailure(failure),
    leadsToStartPage: false,
  };
}
