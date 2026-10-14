import * as fs from 'fs';
import * as path from 'path';
import {ParticipantId} from '../../common/Types';
import {ALL_LANGUAGES, LANGUAGE} from '../../common/constants';

/*
 * Language a player chose in the settings: it lives only in the browser, open game pages send it with every
 * status poll (api/status). The admin overview shows it as a small flag in front of the name.
 * Kept in a small file next to the database, so the flags survive a server restart.
 */
function defaultFile(): string {
  return process.env.PARTICIPANT_LANGUAGES_FILE ?? path.resolve('db', 'participant-languages.json');
}

let languages: Map<string, LANGUAGE> | undefined;

export function isLanguage(value: string | undefined): value is LANGUAGE {
  return value !== undefined && (ALL_LANGUAGES as ReadonlyArray<string>).includes(value);
}

function loaded(): Map<string, LANGUAGE> {
  if (languages === undefined) {
    languages = new Map();
    try {
      const parsed: Record<string, string> = JSON.parse(fs.readFileSync(defaultFile(), 'utf8'));
      for (const [id, lang] of Object.entries(parsed)) {
        if (isLanguage(lang)) {
          languages.set(id, lang);
        }
      }
    } catch {
      // No file yet (first start) or unreadable: start with an empty list
    }
  }
  return languages;
}

/** Remembers the language; writes the file only when it changed (the poll comes every few seconds). */
export function noteParticipantLanguage(id: ParticipantId, lang: LANGUAGE): void {
  const known = loaded();
  if (known.get(id) === lang) {
    return;
  }
  known.set(id, lang);
  try {
    const file = defaultFile();
    fs.mkdirSync(path.dirname(file), {recursive: true});
    fs.writeFileSync(file, JSON.stringify(Object.fromEntries(known)));
  } catch (error) {
    // The game must run even if the file cannot be written
    console.error('Cannot record participant language', error);
  }
}

export function participantLanguage(id: ParticipantId): LANGUAGE | undefined {
  return loaded().get(id);
}

/** Only for tests: forgets what was read, so the next access reads the (test) file again. */
export function clearParticipantLanguages(): void {
  languages = undefined;
}
