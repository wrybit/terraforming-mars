import {paths} from '@/common/app/paths';
import {LogMessage} from '@/common/logs/LogMessage';
import {ParticipantId} from '@/common/Types';

// One generation's part of the log stream
export type GenerationLog = {
  generation: number,
  messages: Array<LogMessage>,
};

// Finished generations never change again, so they are fetched only once per participant
// (the game view remounts on every update and would otherwise reload the whole history each time)
const finishedGenerations = new Map<string, Array<LogMessage>>();

let abortController: AbortController | undefined;

function cacheKey(id: ParticipantId, generation: number): string {
  return id + ':' + generation;
}

async function fetchGeneration(id: ParticipantId, generation: number, signal: AbortSignal): Promise<Array<LogMessage>> {
  const response = await fetch(`${paths.API_GAME_LOGS}?id=${id}&generation=${generation}`, {signal});
  if (!response.ok) {
    throw new Error(`error updating messages, response code ${response.status}`);
  }
  return response.json();
}

// The finished generations already known, without a request – lets the log render its history immediately
export function cachedLogStream(id: ParticipantId, currentGeneration: number): Array<GenerationLog> {
  const stream: Array<GenerationLog> = [];
  for (let generation = 1; generation <= currentGeneration; generation++) {
    stream.push({generation, messages: finishedGenerations.get(cacheKey(id, generation)) ?? []});
  }
  return stream;
}

// All generations 1..currentGeneration as one stream. Generations before the current one come from the cache when known.
export async function fetchLogStream(id: ParticipantId, currentGeneration: number): Promise<Array<GenerationLog> | undefined> {
  // Aborts a pending request of a previous instance before starting the new one.
  // If the past call is complete, .abort() does nothing.
  abortController?.abort();
  abortController = new AbortController();
  const signal = abortController.signal;

  const generations = Array.from({length: currentGeneration}, (_, index) => index + 1);
  try {
    return await Promise.all(generations.map(async (generation) => {
      const key = cacheKey(id, generation);
      const cached = finishedGenerations.get(key);
      if (cached !== undefined) {
        return {generation, messages: cached};
      }
      const messages = await fetchGeneration(id, generation, signal);
      if (generation < currentGeneration) {
        finishedGenerations.set(key, messages);
      }
      return {generation, messages};
    }));
  } catch (err: any) {
    if (err.name === 'AbortError') {
      // ignore aborted requests
      return undefined;
    }
    console.error(err.message ?? 'error updating messages, unable to reach server');
    return undefined;
  }
}
