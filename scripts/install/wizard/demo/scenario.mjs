// Demo mode (--demo): first asks which situation to play through, then fakes the system accordingly.
// Nothing is installed; only a small fake installation in the temp folder for the "update" case.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {select} from '../prompts.mjs';
import {box} from '../ui/box.mjs';
import {BOX_INDENT, BOX_WIDTH} from '../ui/layout.mjs';
import {style} from '../ui/theme.mjs';
import {writeLines} from '../terminal.mjs';

const FAKE_PACKAGE = {tag: 'rust-ai-v0.9.0', archiveName: 'rust-ai-v0.9.0.tar.gz'};

/** Fake existing installation, so the wizard offers its settings as defaults like on a real update. */
function fakeExistingInstallation() {
  const directory = path.join(os.tmpdir(), 'tm-installer-demo');
  fs.mkdirSync(path.join(directory, '.git'), {recursive: true});
  fs.writeFileSync(path.join(directory, 'package.json'), '{}\n');
  fs.writeFileSync(path.join(directory, '.env'), 'SERVER_NAME=Friday game night\nPORT=9090\nSERVER_ID=demo-password-123\nAI_ENGINE=typescript\n');
  return directory;
}

export async function askDemoScenario() {
  writeLines([
    ...box({title: 'Demo mode', sections: [['', `  ${style.white('Plays the whole installer without changing anything.')}`, `  ${style.gray('First choose the situation to try.')}`, '']], width: BOX_WIDTH, indent: BOX_INDENT, titleStyle: style.purple}),
    '',
  ]);
  const progress = (index) => `${index} / 6`;
  const system = await select({message: 'System', progress: progress(1), initial: 'linux', choices: [
    {label: 'Linux', value: 'linux'}, {label: 'macOS', value: 'mac'}, {label: 'Windows', value: 'windows'},
  ]});
  const missing = await select({message: 'Requirements', progress: progress(2), initial: 'none', choices: [
    {label: 'Git and Node 22 there', value: 'none'},
    {label: 'Node 22 missing', value: 'node'},
    {label: 'Git and Node missing', value: 'both'},
  ]});
  const hasDocker = await select({message: 'Docker', progress: progress(3), initial: false, choices: [
    {label: 'Not installed', value: false}, {label: 'Installed', value: true},
  ]});
  const rustRelease = await select({message: 'Rust AI release', progress: progress(4), initial: true, choices: [
    {label: 'Available', value: true}, {label: 'Not released yet', value: false},
  ]});
  const existing = await select({message: 'Installation', progress: progress(5), initial: false, choices: [
    {label: 'Fresh install', value: false}, {label: 'Update an existing one', value: true},
  ]});
  const failure = await select({message: 'Outcome', progress: progress(6), initial: 'none', choices: [
    {label: 'Everything works', value: 'none'},
    {label: 'Build fails', value: 'build'},
    {label: 'Server does not answer', value: 'check'},
  ]});
  writeLines(['']);
  return {
    missing,
    failure,
    existingDirectory: existing ? fakeExistingInstallation() : undefined,
    platform: {
      system,
      arch: system === 'mac' ? 'arm64' : 'x64',
      homeDirectory: os.homedir(),
      hasDocker,
      hasSystemd: system === 'linux',
      rustAiPackages: rustRelease ? {native: FAKE_PACKAGE, docker: FAKE_PACKAGE} : {},
    },
  };
}
