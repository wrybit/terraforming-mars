import {expect} from 'chai';
import {readFileSync, readdirSync, statSync} from 'fs';
import {join} from 'path';
import {LOG_INFO_LINES} from '@/client/components/logpanel/logActions';

// Every server log line that names an amount (icon shortcode, M€, TR) must be known to the log grouping, otherwise
// it stands as text with its values on the left and cuts the following effects off their action row.
// A new upstream line shows up here: read it in logActions.ts or list it in LOG_INFO_LINES.
const VALUE = /:(r|p|cr|i|mc):|M€|\bTR\b|\d+\s*(M€|TR)/;

function sourceFiles(directory: string): Array<string> {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? sourceFiles(path) : path.endsWith('.ts') ? [path] : [];
  });
}

function logTemplates(): Map<string, string> {
  const templates = new Map<string, string>();
  for (const path of sourceFiles('src/server')) {
    for (const match of readFileSync(path, 'utf8').matchAll(/\blog\(\s*'((?:[^'\\]|\\.)*)'/g)) {
      templates.set(match[1], path);
    }
  }
  return templates;
}

describe('log templates', () => {
  it('reads every server log line with values, or keeps it as an info line on purpose', () => {
    const grouping = readFileSync('src/client/components/logpanel/logActions.ts', 'utf8');
    const unknown = [...logTemplates()].filter(([template]) => VALUE.test(template) && !grouping.includes(`'${template}'`));
    expect(unknown.map(([template, path]) => `${path}: ${template}`)).deep.eq([]);
  });

  it('lists info lines that the server really logs', () => {
    const templates = logTemplates();
    const unescaped = new Set([...templates.keys()].map((template) => template.replace(/\\'/g, '\'')));
    expect([...LOG_INFO_LINES].filter((template) => !unescaped.has(template))).deep.eq([]);
  });
});
