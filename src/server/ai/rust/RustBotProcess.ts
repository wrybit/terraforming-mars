// The Rust bot as a child process (built in the private lab repo, only the program ships): one JSON request per
// line on stdin, one JSON answer per line on stdout, answers in request order.
import {ChildProcessWithoutNullStreams, spawn} from 'child_process';
import * as readline from 'readline';

// A request the bot does not answer in this time counts as failed (the TS AI then moves instead)
const REQUEST_TIMEOUT_MILLISECONDS = 60_000;

/** Search effort; timeLimit: thinking time per decision in milliseconds (the bot stops its search there) */
export type RustBotSettings = {rollouts: number, threads: number, horizon: number, candidates: number, timeLimit: number};

type Waiting = {resolve: (value: any) => void, reject: (error: Error) => void, timer: ReturnType<typeof setTimeout>};

/** The parts of a bot process the mirror uses (a fake one in tests). */
export type RustBot = Pick<RustBotProcess, 'alive' | 'request' | 'close'>;

export class RustBotProcess {
  private readonly child: ChildProcessWithoutNullStreams;
  private readonly waiting: Array<Waiting> = [];
  private failure: Error | undefined = undefined;

  constructor(binary: string, data: string, settings: RustBotSettings) {
    this.child = spawn(binary, [data, String(settings.rollouts), String(settings.threads), String(settings.horizon), String(settings.candidates),
      'search', String(settings.timeLimit)]);
    readline.createInterface({input: this.child.stdout}).on('line', (line) => {
      const next = this.waiting.shift();
      if (next === undefined) {
        return;
      }
      clearTimeout(next.timer);
      try {
        next.resolve(JSON.parse(line));
      } catch (error) {
        next.reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
    this.child.stderr.on('data', (chunk) => process.stderr.write(`rust bot: ${chunk}`));
    this.child.on('error', (error) => this.fail(error));
    this.child.on('exit', (code, signal) => this.fail(new Error(`rust bot exited (${code ?? signal})`)));
  }

  public get alive(): boolean {
    return this.failure === undefined;
  }

  /**
   * Sends one request; the promise rejects when the bot answers with an error, dies or takes too long.
   *
   * Too long ends the process: its later answers would belong to the wrong requests.
   */
  public request(message: unknown, timeoutMilliseconds: number = REQUEST_TIMEOUT_MILLISECONDS): Promise<any> {
    if (this.failure !== undefined) {
      return Promise.reject(this.failure);
    }
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => this.fail(new Error(`rust bot did not answer within ${timeoutMilliseconds} ms`)), timeoutMilliseconds);
      this.waiting.push({resolve: (answer) => {
        if (answer?.error !== undefined) {
          reject(new Error(String(answer.error)));
        } else {
          resolve(answer);
        }
      }, reject, timer});
      this.child.stdin.write(JSON.stringify(message) + '\n');
    });
  }

  public close(): void {
    this.fail(new Error('rust bot closed'));
  }

  private fail(error: Error): void {
    if (this.failure !== undefined) {
      return;
    }
    this.failure = error;
    for (const waiting of this.waiting.splice(0)) {
      clearTimeout(waiting.timer);
      waiting.reject(error);
    }
    this.child.stdin.end();
    this.child.kill();
  }
}
