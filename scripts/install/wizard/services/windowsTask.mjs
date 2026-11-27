// Windows: scheduled task at login, without admin rights or extra tools (no NSSM).
// A small start script in db/ sets the working folder and the log, which the task can't do.
import fs from 'node:fs';
import path from 'node:path';
import {run} from '../commands.mjs';
import {SERVER_ENTRY} from '../constants.mjs';

const TASK_NAME = 'Terraforming Mars';

function quote(text) {
  return `'${text.replace(/'/g, "''")}'`;
}

function startScript({directory}) {
  return `# Started by the Windows task "${TASK_NAME}" (created by the installer)
Set-Location -LiteralPath ${quote(directory)}
$env:NODE_ENV = 'production'
& ${quote(process.execPath)} ${quote(SERVER_ENTRY)} *>> 'db\\server.log'
`;
}

function registerScript(scriptPath) {
  const argument = `-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "${scriptPath}"`;
  return `
$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument ${quote(argument)}
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
Register-ScheduledTask -TaskName ${quote(TASK_NAME)} -Action $action -Trigger $trigger -Force | Out-Null
Stop-ScheduledTask -TaskName ${quote(TASK_NAME)} -ErrorAction SilentlyContinue
Start-ScheduledTask -TaskName ${quote(TASK_NAME)}
`;
}

export const windowsTaskService = {
  id: 'windows-task',
  systems: ['windows'],
  label: 'Run in the background',
  hint: 'starts when you log in',
  unavailableReason: () => undefined,
  startsInBackground: true,
  async install(context) {
    const scriptPath = path.join(context.directory, 'db', 'start-server.ps1');
    fs.mkdirSync(path.dirname(scriptPath), {recursive: true});
    fs.writeFileSync(scriptPath, startScript(context));
    // Passed as EncodedCommand so paths with spaces and quotes don't break
    const encoded = Buffer.from(registerScript(scriptPath), 'utf16le').toString('base64');
    await run('powershell.exe', ['-NoProfile', '-EncodedCommand', encoded], {log: context.log});
  },
  // Update: the task stays, it is only stopped and started again with the new build
  async restart(context) {
    const script = `Stop-ScheduledTask -TaskName ${quote(TASK_NAME)} -ErrorAction SilentlyContinue\nStart-ScheduledTask -TaskName ${quote(TASK_NAME)}`;
    await run('powershell.exe', ['-NoProfile', '-EncodedCommand', Buffer.from(script, 'utf16le').toString('base64')], {log: context.log});
  },
  logHint: 'Get-Content db\\server.log -Wait',
};
