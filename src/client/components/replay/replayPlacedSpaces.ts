import {LogMessageDataType} from '@/common/logs/LogMessageDataType';
import {ReplaySourceModel} from '@/common/models/ReplaySourceModel';
import {ReplayStep} from './replaySteps';

/** Spaces the lines of a step name: where its tiles were placed (and their placement bonuses). */
export function replayPlacedSpaces(source: ReplaySourceModel, step: ReplayStep): Array<string> {
  const spaces = source.log.slice(step.line, step.state + 1)
    .flatMap((message) => message.data.filter((datum) => datum.type === LogMessageDataType.SPACE))
    .map((datum) => String(datum.value));
  return [...new Set(spaces)];
}
