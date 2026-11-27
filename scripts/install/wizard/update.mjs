// Update of an existing installation: shows what runs and what is new, and updates with one choice –
// without asking the installation questions again. "Change settings" leads to the normal wizard.
import {run} from './commands.mjs';
import {select} from './prompts.mjs';
import {serviceById} from './services/index.mjs';
import {buildGame, installDependencies} from './steps/build.mjs';
import {waitForServer} from './steps/healthCheck.mjs';
import {writeInstallRecord} from './steps/installRecord.mjs';
import {hasUpdate} from './steps/installedState.mjs';
import {installRustAi} from './steps/rustAi.mjs';
import {fetchSource} from './steps/source.mjs';
import {writeLine} from './terminal.mjs';
import {box} from './ui/box.mjs';
import {BOX_INDENT, BOX_WIDTH, LIST_INDENT} from './ui/layout.mjs';
import {style} from './ui/theme.mjs';
import {homeRelative, padVisible, shortenMiddle} from './ui/text.mjs';

const LABEL_WIDTH = 13;

function row(label, value) {
  return `  ${padVisible(style.gray(label), LABEL_WIDTH)}${value}`;
}

function version(commit, date) {
  return commit === undefined ? style.gray('unknown') : `${commit} ${style.gray(`· ${date}`)}`;
}

function gameLine(game) {
  if (game.offline) {
    return `${version(game.commit, game.date)}  ${style.gray('(no connection to GitHub)')}`;
  }
  if (!game.behind) {
    return `${version(game.commit, game.date)}  ${style.gray('newest')}`;
  }
  return `${version(game.commit, game.date)}  ${style.orange('→')}  ${style.white(version(game.latestCommit, game.latestDate))}`;
}

function rustLine(rustAi) {
  if (rustAi.installed === undefined) {
    return style.gray('not installed');
  }
  if (!rustAi.hasUpdate) {
    return `${rustAi.installed}  ${style.gray('newest')}`;
  }
  return `${rustAi.installed}  ${style.orange('→')}  ${style.white(rustAi.available)}`;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Commit titles are read from the start: cut at the end, not in the middle */
function shortenEnd(text, maximum) {
  return text.length <= maximum ? text : `${text.slice(0, maximum - 1)}…`;
}

/** "today", "1 day", "12 days" */
function ageText(timeMs, nowMs) {
  const days = Math.floor((nowMs - timeMs) / DAY_MS);
  return days <= 0 ? 'today' : `${days} ${days === 1 ? 'day' : 'days'}`;
}

/**
 * How far the installation is behind, in two lines that fit the box: the missing changes, then the age of the
 * installed version and the time since the last update.
 */
function distanceLines(game, nowMs = Date.now()) {
  const lines = [];
  if (game.behind) {
    lines.push(style.orange(`${game.behind} ${game.behind === 1 ? 'change' : 'changes'} missing`));
  }
  const parts = [];
  if (game.dateMs !== undefined) {
    const age = ageText(game.dateMs, nowMs);
    parts.push(style.gray(age === 'today' ? 'version from today' : `version ${age} old`));
  }
  if (game.lastUpdateMs !== undefined) {
    const since = ageText(game.lastUpdateMs, nowMs);
    parts.push(style.gray(since === 'today' ? 'last update today' : `last update ${since} ago`));
  }
  if (parts.length > 0) {
    lines.push(parts.join(style.gray(' · ')));
  }
  return lines;
}

/** The panel at the top of the update: installed against newest, and the titles of the new changes. */
export function updateScreenLines(state) {
  const service = serviceById(state.runMode);
  const available = hasUpdate(state);
  const facts = [
    '',
    row('Folder', shortenMiddle(homeRelative(state.directory), 50)),
    row('Game', gameLine(state.game)),
  ];
  facts.push(...distanceLines(state.game).map((line) => row('', line)));
  facts.push(row('Rust AI', rustLine(state.rustAi)), row('Runs as', `${service.label} ${style.gray(`· port ${state.port}`)}`), '');
  const sections = [facts];
  if (state.game.newTitles.length > 0) {
    const more = state.game.behind - state.game.newTitles.length;
    sections.push([
      '',
      `  ${style.gray('New')}`,
      ...state.game.newTitles.map((title) => `  ${style.orange('·')} ${shortenEnd(title, BOX_WIDTH - 6)}`),
      ...(more > 0 ? [`  ${style.gray(`  and ${more} more`)}`] : []),
      '',
    ]);
  }
  return box({
    title: available ? 'Update available' : 'Terraforming Mars is up to date',
    titleStyle: available ? style.orange : style.white,
    sections,
    width: BOX_WIDTH,
    indent: BOX_INDENT,
  });
}

/** Update now, change the settings with the full wizard, or leave. */
export function askUpdateChoice(state) {
  const choices = hasUpdate(state) ? [
    {label: 'Update now', value: 'update', hint: 'keeps settings and games'},
    {label: 'Change settings', value: 'settings', hint: 'all installation questions'},
    {label: 'Cancel', value: 'cancel'},
  ] : [
    {label: 'Exit', value: 'cancel'},
    {label: 'Change settings', value: 'settings', hint: 'all installation questions'},
  ];
  return select({message: 'What now?', choices, initial: choices[0].value});
}

/** Only what has something to do: new code needs a build, a newer Rust AI its package, then a restart. */
export function updateSteps(state, {log}) {
  const service = serviceById(state.runMode);
  const target = {directory: state.directory, port: state.port, log};
  const steps = [];
  if (state.game.behind) {
    steps.push({title: 'Update code', run: () => fetchSource(target)});
    if (service.needsLocalBuild !== false) {
      steps.push({title: 'Install dependencies', run: () => installDependencies(target)});
      steps.push({title: 'Build game', run: () => buildGame(target)});
    }
  }
  if (state.rustAi.hasUpdate) {
    steps.push({title: 'Update Rust AI', run: () => installRustAi(target, state.rustAi.package)});
  }
  if (service.restart) {
    steps.push({title: 'Restart server', run: async () => {
      await service.restart(target);
      writeInstallRecord(state.directory, {runMode: state.runMode});
    }});
  }
  if (service.startsInBackground) {
    steps.push({title: 'Check server', run: () => waitForServer(state.port)});
  }
  return steps;
}

/** sudo asks before the checklist starts, so its password prompt does not collide with it */
export async function prepareUpdate(state) {
  if (serviceById(state.runMode).needsSudo) {
    writeLine(`\n${LIST_INDENT}${style.gray('Restarting the service needs sudo – enter your password if asked.')}`);
    await run('sudo', ['-v']);
  }
}

export function updatedLines(state) {
  const service = serviceById(state.runMode);
  const pairs = [
    row('Game', style.white(state.game.latestCommit ?? state.game.commit ?? '')),
    ...(state.rustAi.installed === undefined ? [] : [row('Rust AI', style.white(state.rustAi.hasUpdate ? state.rustAi.available : state.rustAi.installed))]),
    row('Address', style.white(`http://localhost:${state.port}`)),
    ...(service.logHint ? [row('Log', style.white(service.logHint))] : []),
  ];
  const notes = service.restart ? [] : [`  ${style.gray('Start the server again to use the new version.')}`, ''];
  return box({title: '✔ Terraforming Mars is updated', titleStyle: style.orange, width: BOX_WIDTH, indent: BOX_INDENT, sections: [['', ...pairs, '', ...notes]]});
}
