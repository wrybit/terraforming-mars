import {expect} from 'chai';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {appendDecision, decisionLogFileName} from '../../src/server/ai/decisionLogFile';
import {DecisionRecord} from '../../src/server/ai/decisionTrace';

function record(gameId: string, chosen: string): DecisionRecord {
  return {
    gameId,
    generation: 1,
    phase: 'action',
    player: 'blue',
    kind: 'action',
    title: 'Take your first action',
    state: {
      megaCredits: 0, steel: 0, titanium: 0, plants: 0, energy: 0, heat: 0,
      production: {megacredits: 0, steel: 0, titanium: 0, plants: 0, energy: 0, heat: 0},
      terraformRating: 20, victoryPoints: 20, hand: [], tableau: 0,
      tableauCards: [], draftedCards: [], tags: {},
    },
    globals: {temperature: -30, oxygen: 0, oceans: 0},
    options: [{label: chosen, value: 1, chosen: true}],
    chosen,
    milliseconds: 1,
    saveId: 0,
  };
}

describe('decisionLogFile', () => {
  let directory: string;

  beforeEach(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'decision-log-'));
  });

  afterEach(() => {
    fs.rmSync(directory, {recursive: true, force: true});
  });

  it('appends one JSON line per decision to the file of its game', () => {
    appendDecision(directory, record('g123', 'first'));
    appendDecision(directory, record('g123', 'second'));
    appendDecision(directory, record('g456', 'other game'));

    const lines = fs.readFileSync(path.join(directory, 'g123.jsonl'), 'utf8').trim().split('\n');
    expect(lines.map((line) => JSON.parse(line).chosen)).deep.eq(['first', 'second']);
    expect(fs.existsSync(path.join(directory, 'g456.jsonl'))).is.true;
  });

  it('never writes outside the directory', () => {
    expect(decisionLogFileName(directory, '../escape')).eq(path.join(directory, '___escape.jsonl'));
  });
});
