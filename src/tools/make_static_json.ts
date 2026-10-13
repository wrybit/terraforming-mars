// Generates the files settings.json and translations.json, stored in src/genfiles
import '@/server/init';

import fs from 'fs';
import child_process from 'child_process';
import path from 'path';
import * as constants from '../common/constants';
import {localeDirectories} from './make_extensions';

function mkdirQuietly(path: string) {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path);
  }
}

function readdir(path: string, predicate: (dirent: string) => boolean) {
  const entries = fs.readdirSync(path);
  return entries.filter(predicate);
}

type Translation = {[lang: string]: string}

/**
 * Reads all the translations in src/locales (and the locales of the extensions), and returns a data structure of this
 * structure:
 *
 * {
 *   'Hello' : {
 *     'es': 'Hola',
 *     'de': 'Guten Tag',
 *   },
 * },
 */

function getAllTranslations(): {[phrase: string]: Translation} {
  const translations: {[phrase: string]: Translation} = {};
  const duplicates: Array<{lang: string, phrase: string}> = [];

  for (const translationsPath of localeDirectories()) {
    const languageDirectories = readdir(
      translationsPath,
      (dirent) => dirent.length === 2 && fs.statSync(path.join(translationsPath, dirent)).isDirectory(),
    );

    for (const lang of languageDirectories) {
      const translationDir = path.resolve(path.join(translationsPath, lang));
      const languageFiles = readdir(
        translationDir,
        (dirent) => dirent.endsWith('.json'),
      );

      for (const file of languageFiles) {
        const filename = path.join(translationDir, file);
        try {
          const content = fs.readFileSync(filename, 'utf8');
          const json = JSON.parse(content);

          for (const phrase of Object.keys(json)) {
            if (translations[phrase] === undefined) {
              translations[phrase] = {};
            }
            if (translations[phrase][lang] !== undefined) {
              duplicates.push({lang, phrase});
              continue;
            }
            const translated = json[phrase];
            if (translated.trim() === phrase.trim()) {
              throw new Error('Do not repeat a translation with its own text: ' + phrase);
            }
            if (translated.trim().length !== 0) {
              translations[phrase][lang] = translated;
            }
          }
        } catch (e) {
          throw new Error(`While parsing ${filename}`, {cause: e});
        }
      }
    }
  }

  if (duplicates.length > 0) {
    for (const {lang, phrase} of duplicates) {
      console.error(`${lang}: Repeated translation for [${phrase}]`);
    }
    const msg = `Found ${duplicates.length} duplicate translation(s)`;
    if (!process.argv.includes('--allow-duplicates')) {
      throw new Error(msg);
    } else {
      console.error(msg);
    }
  }

  return translations;
}

function getBuildMetadata(): {head: string, date: string} {
  // assumes SOURCE_VERSION is git hash
  if (process.env.SOURCE_VERSION) {
    return {
      head: process.env.SOURCE_VERSION.substring(0, 7),
      date: new Date().toUTCString().replace(/ \(.+\)/, ''),
    };
  }
  try {
    const output = child_process.execSync(`git log -1 --pretty=format:"%h %cD"`).toString();
    const [head, ...rest] = output.split(' ');
    return {head, date: rest.join(' ')};
  } catch (error) {
    console.error('unable to generate app version', error);
    return {head: 'n/a', date: 'n/a'};
  }
}

// Last commits of the built code for the admin dashboard (server only, so the client bundle stays small).
// Tab-separated, since commit titles may contain any other character. Without git the list stays empty.
function writeRecentCommits() {
  let commits: Array<{hash: string, time: string, title: string}> = [];
  try {
    const output = child_process.execSync('git log -25 --pretty=format:"%h%x09%cI%x09%s"').toString();
    commits = output.split('\n').filter((line) => line !== '').map((line) => {
      const [hash, time, ...title] = line.split('\t');
      return {hash, time, title: title.join('\t')};
    });
  } catch (error) {
    console.error('unable to list recent commits', error);
  }
  fs.writeFileSync('src/genfiles/recentCommits.json', JSON.stringify(commits));
}

function writeBuildMetadata() {
  function getEnv(ev: string, dv: number) {
    return process.env[ev] ? Number(process.env[ev]): dv;
  }

  const buildmetadata = getBuildMetadata();
  const settings = {
    head: buildmetadata.head,
    builtAt: buildmetadata.date,
    waitingForTimeout: getEnv('WAITING_FOR_TIMEOUT', constants.DEFAULT_WAITING_FOR_TIMEOUT),
    logLength: getEnv('LOG_LENGTH', constants.DEFAULT_LOG_LENGTH),
    discordClientId: process.env['DISCORD_CLIENT_ID'] ?? '',
  };
  fs.writeFileSync('src/genfiles/settings.json', JSON.stringify(settings));
}

/**
 * Generate translation files in `/assets/locales/*.json` to load them async by the client
 */
function generateTranslations() {
  const [localesDir, ...extensionLocalesDirs] = localeDirectories();
  const destinationPath = path.join(process.cwd(), 'assets/locales');

  mkdirQuietly(destinationPath);

  const localesCodes = fs.readdirSync(localesDir).filter(
    (entry) => fs.statSync(path.join(localesDir, entry)).isDirectory(),
  );
  localesCodes.forEach((localeCode) => {
    // The game's own files first, then those of the extensions for the same language
    const localeDirs = [localesDir, ...extensionLocalesDirs]
      .map((dir) => path.join(dir, localeCode))
      .filter((dir) => fs.existsSync(dir));
    const localeObject = localeDirs.reduce((localeObject, localeDir) => {
      for (const localeFile of fs.readdirSync(localeDir).filter((dirent) => dirent.endsWith('.json'))) {
        Object.assign(localeObject, require(path.join(localeDir, localeFile)));
      }
      return localeObject;
    }, {});

    const destinationFile = path.join(destinationPath, `${localeCode}.json`);
    fs.writeFileSync(destinationFile, JSON.stringify(localeObject));
  });
}

function writeTranslations() {
  const translations = getAllTranslations();
  fs.writeFileSync('src/genfiles/translations.json', JSON.stringify(translations));
}

mkdirQuietly('src/genfiles');

writeBuildMetadata();
writeRecentCommits();
generateTranslations();
writeTranslations();
