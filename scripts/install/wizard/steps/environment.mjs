// Writes the answers to .env. Based on .env.sample so all its explanations stay;
// existing values are replaced, commented templates activated, unknown keys appended.
import fs from 'node:fs';
import path from 'node:path';

function setVariable(content, key, value) {
  const line = `${key}=${value}`;
  const active = new RegExp(`^${key}=.*$`, 'm');
  if (active.test(content)) {
    return content.replace(active, line);
  }
  const commented = new RegExp(`^#\\s*${key}=.*$`, 'm');
  if (commented.test(content)) {
    return content.replace(commented, line);
  }
  return `${content.replace(/\n*$/, '\n')}${line}\n`;
}

function removeVariable(content, key) {
  return content.replace(new RegExp(`^${key}=.*$`, 'm'), `# ${key}=`);
}

export function readVariable(directory, key) {
  const file = path.join(directory, '.env');
  if (!fs.existsSync(file)) {
    return undefined;
  }
  return fs.readFileSync(file, 'utf8').match(new RegExp(`^${key}=(.*)$`, 'm'))?.[1];
}

/** `variables`: key → value; undefined or '' comments the key out (= server default). */
export function writeEnvironment({directory}, variables) {
  const file = path.join(directory, '.env');
  const sample = path.join(directory, '.env.sample');
  let content = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : fs.readFileSync(sample, 'utf8');
  for (const [key, value] of Object.entries(variables)) {
    content = value === undefined || value === '' ? removeVariable(content, key) : setVariable(content, key, value);
  }
  fs.writeFileSync(file, content, {mode: 0o600});
}
