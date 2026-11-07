import {AiTrainingFeed} from '../../common/lobby/AiTrainingFeed';

/** Reads the coordinator of the AI test batches; the address comes from AI_TRAINING_FEED (with ?instance=<computer>) */
export type AiTrainingFeedSource = {
  feed(): Promise<AiTrainingFeed>;
  /** Serialized final game as JSON text */
  game(gamePath: string): Promise<string>;
};

// The lobby polls every few seconds: a slow or switched-off coordinator must not hold it up
const TIMEOUT_MS = 4000;

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, {signal: AbortSignal.timeout(TIMEOUT_MS)});
  if (!response.ok) {
    throw new Error(`${url}: HTTP ${response.status}`);
  }
  return response.text();
}

export function httpFeedSource(feedUrl: string): AiTrainingFeedSource {
  return {
    feed: async () => JSON.parse(await fetchText(feedUrl)),
    game: (gamePath) => fetchText(new URL(gamePath, feedUrl).toString()),
  };
}

/** Undefined: this server shows no AI training games */
export function configuredFeedSource(): AiTrainingFeedSource | undefined {
  const url = process.env.AI_TRAINING_FEED?.trim();
  return url ? httpFeedSource(url) : undefined;
}
