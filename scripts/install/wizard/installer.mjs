#!/usr/bin/env node
// Entry of the install wizard: header, questions, summary, checklist, result.
// Started by install.sh / install.ps1, or directly: node scripts/install/wizard/installer.mjs (--demo tries it out)
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {flagName, helpText, parseArguments} from './arguments.mjs';
import {capture, run} from './commands.mjs';
import {askDemoScenario} from './demo/scenario.mjs';
import {simulateRequirements, simulatedSteps} from './demo/simulation.mjs';
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
  const notes = [`  ${style.gray('Update: run the installer again – settings are kept')}`];
  if (service.id === 'none') {
    notes.unshift(`  ${style.gray(`Start: cd ${shortenMiddle(homeRelative(answers.installDirectory), 30)} && npm run start`)}`);
  }
  return box({title, titleStyle: style.orange, width: BOX_WIDTH, indent: BOX_INDENT, sections: [['', ...rows(pairs), '', ...notes, '']]});
}

function failedLines(error, logFile) {
  return box({title: '✖ Installation stopped', titleStyle: style.red, width: BOX_WIDTH, indent: BOX_INDENT, sections: [[
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
    {title: 'Write settings', run: () => writeEnvironment(target, {
      SERVER_NAME: answers.serverName,
      PORT: answers.port,
      SERVER_ID: answers.adminPassphrase,
      POSTGRES_HOST: answers.database === 'postgres' ? buildConnection({host: answers.postgresHost, port: answers.postgresPort, database: answers.postgresDatabase, user: answers.postgresUser, password: answers.postgresPassword}) : undefined,
      URL_ROOT: answers.publicUrl,
      AI_ENGINE: answers.aiEngine,
    })},
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

  const context = {
    platform,
    defaultDirectory: scenario?.existingDirectory ?? (scenario ? undefined : checkoutAroundWizard(wizardDirectory)) ?? path.join(platform.homeDirectory, 'terraforming-mars'),
  };
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
