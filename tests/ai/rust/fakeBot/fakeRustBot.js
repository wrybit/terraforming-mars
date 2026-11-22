#!/usr/bin/env node
// Fake Rust bot for tests: same line protocol as the real one. The first argument (the data folder of the real
// bot) picks the behavior at a decision: "crash" exits, "hang" never answers, "answer" sends an empty chain;
// "dead" exits right at the start.
const readline = require('readline');
const mode = process.argv[2];
if (mode === 'dead') {
  process.exit(1);
}
readline.createInterface({input: process.stdin}).on('line', (line) => {
  const request = JSON.parse(line);
  if (request.decide === undefined) {
    process.stdout.write('{}\n');
  } else if (mode === 'crash') {
    process.exit(3);
  } else if (mode === 'answer') {
    process.stdout.write(JSON.stringify({chain: []}) + '\n');
  }
});
