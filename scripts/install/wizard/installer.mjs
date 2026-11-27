#!/usr/bin/env node
// Entry of the install wizard: header, questions, summary, checklist, result.
// Started by install.sh / install.ps1, or directly: node scripts/install/wizard/installer.mjs (--demo tries it out)
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {flagName, helpText, parseArguments} from './arguments.mjs';
import {capture, run} from './commands.mjs';
import {askDemoScenario} from './demo/scenario.mjs';
import {demoInstalledState, simulateRequirements, simulatedSteps, simulatedUpdateSteps} from './demo/simulation.mjs';
import {checkoutAroundWizard, detectPlatform} from './platform.mjs';
import {buildConnection} from './postgresConnection.mjs';
import {confirm, input, select} from './prompts.mjs';
import {QUESTIONS, rustAiPackageFor} from './questions.mjs';
import {serviceById} from './services/index.mjs';
import {buildGame, installDependencies} from './steps/build.mjs';
import {writeEnvironment} from './steps/environment.mjs';
import {waitForServer} from './steps/healthCheck.mjs';
import {installRustAi} from './steps/rustAi.mjs';
import {checkTargetFolder, fetchSource, isExistingInstallation} from './steps/source.mjs';
import {writeInstallRecord} from './steps/installRecord.mjs';
import {hasUpdate, readInstalledState} from './steps/installedState.mjs';
import {askUpdateChoice, prepareUpdate, updatedLines, updateScreenLines, updateSteps} from './update.mjs';
import fs from 'node:fs';
import {clearScreen, isInteractive, writeLine, writeLines} from './terminal.mjs';
import {bannerLines} from './ui/banner.mjs';
import {box} from './ui/box.mjs';
import {BOX_INDENT, BOX_WIDTH, LIST_INDENT} from './ui/layout.mjs';
import {runSteps} from './ui/stepRunner.mjs';
import {style} from './ui/theme.mjs';
import {homeRelative, padVisible, shortenMiddle} from './ui/text.mjs';

const wizardDirectory = path.dirname(fileURLToPath(import.meta.url));
const SYSTEM_NAMES = {linux: 'Linux', mac: 'macOS', windows: 'Windows'};

function choicesOf(question, answers, context) {
  return question.choices ? question.choices(answers, context) : [];
}

/** Checks an answer given up front (option/file) with the same rule as the menu. */
function checkPreset(question, value, answers, context) {
  if (question.kind === 'select') {
    // Old option values (e.g. --ai-engine=typescript) are mapped before the check, as later for the answer
    value = question.normalize ? question.normalize(value) : value;
    const choice = choicesOf(question, answers, context).find((candidate) => candidate.value === value);
    if (!choice) {
      throw new Error(`${flagName(question.id)}: "${value}" is not possible here`);
    }
    if (choice.disabled) {
      throw new Error(`${flagName(question.id)}: "${value}" is not available (${choice.disabled})`);
    }
    return value;
  }
  const error = question.validate?.(String(value));
  if (error) {
    throw new Error(`${flagName(question.id)}: ${error}`);
  }
  return String(value);
}

function ask(question, answers, context, progress) {
  const initial = question.initial?.(answers, context);
  if (question.kind === 'select') {
    return select({message: question.message, choices: choicesOf(question, answers, context), initial, progress});
  }
  return input({message: question.message, hint: question.hint, initial, secret: question.kind === 'secret', validate: question.validate, progress});
}

function applicableQuestions(answers) {
  return QUESTIONS.filter((question) => !question.when || question.when(answers));
}

async function collectAnswers(options, context) {
  const answers = {};
  let asked = 0;
  for (const question of QUESTIONS) {
    if (question.when && !question.when(answers)) {
      continue;
    }
    asked++;
    let value;
    if (question.id in options.answers) {
      value = checkPreset(question, options.answers[question.id], answers, context);
    } else if (options.useDefaults) {
      value = checkPreset(question, question.initial?.(answers, context) ?? '', answers, context);
    } else if (!isInteractive()) {
      throw new Error('No terminal for questions. Pass the answers as options or add --defaults (see --help).');
    } else {
      value = await ask(question, answers, context, `${asked} / ${applicableQuestions(answers).length}`);
    }
    answers[question.id] = question.normalize ? question.normalize(value) : value;
  }
  answers.isUpdate = isExistingInstallation(answers.installDirectory);
  return answers;
}

function rows(pairs) {
  return pairs.map(([label, value]) => `  ${padVisible(style.gray(label), 18)}${value}`);
}

function finishedLines(answers, service) {
  const address = answers.publicUrl || `http://localhost:${answers.port}`;
  const title = service.startsInBackground ? '✔ Terraforming Mars is running' : '✔ Terraforming Mars is installed';
  const pairs = [
    ['Game', style.white(address)],
    ['Admin', style.white(`${address}/admin`)],
    ['Admin password', style.orange(style.bold(answers.adminPassphrase))],
  ];
  if (service.logHint) {
    pairs.push(['Log', style.white(service.logHint)]);
  }
  const notes = [`  ${style.gray('Update: run the installer again in this folder')}`];
  if (service.id === 'none') {
    notes.unshift(`  ${style.gray(`Start: cd ${shortenMiddle(homeRelative(answers.installDirectory), 30)} && npm run start`)}`);
  }
  return box({title, titleStyle: style.orange, width: BOX_WIDTH, indent: BOX_INDENT, sections: [['', ...rows(pairs), '', ...notes, '']]});
}

function failedLines(error, logFile, title = '✖ Installation stopped') {
  return box({title, titleStyle: style.red, width: BOX_WIDTH, indent: BOX_INDENT, sections: [[
    '',
    `  ${style.white(shortenMiddle(error.message, BOX_WIDTH - 4))}`,
    '',
    `  ${style.gray('Log')}  ${style.white(shortenMiddle(homeRelative(logFile), BOX_WIDTH - 9))}`,
    `  ${style.gray('Fix the cause and run the installer again.')}`,
    '',
  ]]});
}

function realSteps({answers, service, platform, target}) {
  const steps = [
    {title: answers.isUpdate ? 'Update code' : 'Download code', run: () => fetchSource(target)},
    {title: 'Write settings', run: () => {
      writeInstallRecord(target.directory, {runMode: answers.runMode});
      return writeEnvironment(target, {
      SERVER_NAME: answers.serverName,
      PORT: answers.port,
      SERVER_ID: answers.adminPassphrase,
      POSTGRES_HOST: answers.database === 'postgres' ? buildConnection({host: answers.postgresHost, port: answers.postgresPort, database: answers.postgresDatabase, user: answers.postgresUser, password: answers.postgresPassword}) : undefined,
      URL_ROOT: answers.publicUrl,
      AI_ENGINE: answers.aiEngine,
      });
    }},
  ];
  if (service.needsLocalBuild !== false) {
    steps.push({title: 'Install dependencies', run: () => installDependencies(target)});
    steps.push({title: 'Build game', run: () => buildGame(target)});
  }
  if (answers.aiEngine === 'rust') {
    steps.push({title: 'Install Rust AI', run: () => installRustAi(target, rustAiPackageFor(answers, platform))});
  }
  if (service.startsInBackground) {
    steps.push({title: service.id === 'docker' ? 'Start Docker container' : 'Set up service', run: () => service.install(target)});
    steps.push({title: 'Check server', run: () => waitForServer(answers.port)});
  }
  return steps;
}

/**
 * Folder the installer was started in: an installation there is updated right away. The demo plays it in a temp
 * folder (the fake installation for the update case, an empty one otherwise), never in the real working folder.
 */
function currentFolder(scenario) {
  if (scenario) {
    return scenario.existingDirectory ?? path.join(os.tmpdir(), 'tm-installer-demo-fresh');
  }
  return checkoutAroundWizard(wizardDirectory) ?? process.cwd();
}

/** Suggestion for a new installation: the current folder if it is empty, otherwise a folder of its own inside it. */
function defaultFolder(currentDirectory) {
  if (isExistingInstallation(currentDirectory) || !fs.existsSync(currentDirectory) || fs.readdirSync(currentDirectory).length === 0) {
    return currentDirectory;
  }
  return path.join(currentDirectory, 'terraforming-mars');
}

/**
 * The only question before an update: the folder, and only if the current one holds no installation.
 * The answer counts for the wizard too, so it is never asked twice.
 */
async function installationFolder(options, context, currentDirectory) {
  const question = QUESTIONS.find((candidate) => candidate.id === 'installDirectory');
  let directory;
  if (options.answers.installDirectory !== undefined) {
    directory = question.normalize(String(options.answers.installDirectory));
  } else if (isExistingInstallation(currentDirectory)) {
    directory = currentDirectory;
  } else if (options.useDefaults || !isInteractive()) {
    directory = question.normalize(question.initial({}, context));
  } else {
    directory = question.normalize(await ask(question, {}, context, `1 / ${applicableQuestions({}).length}`));
  }
  options.answers.installDirectory = directory;
  return directory;
}

/** Update screen and run; 'settings' hands over to the full wizard. */
async function runUpdate(directory, {options, platform, scenario}) {
  const state = scenario ? demoInstalledState(directory) : readInstalledState(directory, platform);
  writeLines(updateScreenLines(state));
  writeLine();
  let choice;
  if (options.update) {
    choice = 'update';
  } else if (options.useDefaults) {
    choice = hasUpdate(state) ? 'update' : 'cancel';
  } else if (isInteractive()) {
    choice = await askUpdateChoice(state);
  } else {
    writeLine(`${LIST_INDENT}${style.gray('No terminal for questions: add --update to update, or --settings for the installation questions.')}\n`);
    return 'done';
  }
  if (choice === 'settings') {
    return 'settings';
  }
  if (choice === 'cancel' || !hasUpdate(state)) {
    writeLine(`\n${LIST_INDENT}${style.gray('Nothing changed.')}\n`);
    return 'done';
  }
  if (!scenario) {
    await prepareUpdate(state);
  }
  const logFile = path.join(os.tmpdir(), `terraforming-mars-update-${Date.now()}.log`);
  try {
    await runSteps(scenario ? simulatedUpdateSteps(scenario.failure, logFile) : updateSteps(state, {log: logFile}), {logFile});
  } catch (error) {
    writeLine();
    writeLines(failedLines(error, logFile, '✖ Update stopped'));
    writeLine();
    process.exit(1);
  }
  writeLine();
  writeLines(updatedLines(state));
  writeLine();
  return 'done';
}

function gitVersion() {
  return capture('git', ['--version'])?.match(/\d+\.\d+/)?.[0];
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    writeLine(helpText());
    return;
  }
  clearScreen();
  writeLine();
  const scenario = options.demo ? await askDemoScenario() : undefined;
  if (scenario) {
    await simulateRequirements(scenario.missing);
  }
  const platform = scenario ? scenario.platform : await detectPlatform();
  // The demo choices are done: the installer itself starts on an empty screen, like a real run
  if (scenario) {
    clearScreen();
    writeLine();
  }
  writeLines(bannerLines({
    checks: [
      {label: `Node ${process.version}`, ok: true},
      {label: `git ${scenario ? '2.47' : gitVersion() ?? '?'}`, ok: true},
      {label: 'Docker', ok: platform.hasDocker},
    ],
    note: `${SYSTEM_NAMES[platform.system]} ${platform.arch}${scenario ? ' · demo' : ''}`,
  }));

  const currentDirectory = currentFolder(scenario);
  const context = {platform, defaultDirectory: defaultFolder(currentDirectory)};
  const directory = await installationFolder(options, context, currentDirectory);
  // An installation is there: show what is new and update it, without the installation questions
  if (isExistingInstallation(directory) && !options.settings) {
    const outcome = await runUpdate(directory, {options, platform, scenario});
    if (outcome !== 'settings') {
      return;
    }
  }
  const answers = await collectAnswers(options, context);
  const service = serviceById(answers.runMode);
  if (!scenario) {
    checkTargetFolder(answers.installDirectory);
  }

  if (isInteractive() && !options.skipConfirm && !(await confirm({message: 'Install now?', yes: 'Install now', no: 'Cancel'}))) {
    writeLine(`\n${LIST_INDENT}${style.gray('Nothing changed.')}\n`);
    return;
  }

  // sudo asks for the password before the checklist starts, so the prompt doesn't collide with it
  if (service.needsSudo && !scenario) {
    writeLine(`\n${LIST_INDENT}${style.gray('The service needs sudo – enter your password if asked.')}`);
    await run('sudo', ['-v']);
  }

  const logFile = path.join(os.tmpdir(), `terraforming-mars-install-${Date.now()}.log`);
  const target = {directory: answers.installDirectory, port: answers.port, log: logFile};
  const steps = scenario ? simulatedSteps({answers, service, failure: scenario.failure, logFile}) : realSteps({answers, service, platform, target});
  try {
    await runSteps(steps, {logFile});
  } catch (error) {
    writeLine();
    writeLines(failedLines(error, logFile));
    writeLine();
    process.exit(1);
  }

  writeLine();
  writeLines(finishedLines(answers, service));
  writeLine();
  if (service.id === 'foreground') {
    if (scenario) {
      writeLine(`${LIST_INDENT}${style.gray('Here the server would now run in this window (demo).')}\n`);
    } else {
      writeLine(`${LIST_INDENT}${style.gray('Server output follows – Ctrl+C stops the server.')}\n`);
      await service.install(target);
    }
  }
}

main().catch((error) => {
  writeLine(`\n${LIST_INDENT}${style.red('✖')} ${error.message}\n`);
  process.exit(1);
});
