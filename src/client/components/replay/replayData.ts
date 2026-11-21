import {ReplaySourceModel} from '@/common/models/ReplaySourceModel';
import {ReplayState} from './reconstructReplay';
import {ReplayStep} from './replaySteps';

// An opened replay: its raw material, one state per log line and the steps of the slider
export type ReplayData = {source: ReplaySourceModel, states: Array<ReplayState>, steps: Array<ReplayStep>};
