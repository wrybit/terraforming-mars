// Server part of an optional extension (see src/common/extensions/CommonExtension.ts).
import {IHandler} from '../routes/IHandler';
import {FeedbackReport, FeedbackResult} from '../../common/feedback/FeedbackReport';
import {SerializedGame} from '../SerializedGame';
import {ParticipantId} from '../../common/Types';

/** Delivers a checked report of the feedback overlay on the server (e.g. stores and mails it) */
export type FeedbackDelivery = (report: FeedbackReport, ip: string) => Promise<FeedbackResult>;

/** Start and end of a finished game for its replay (api/replay) */
export type ReplayGames = {start: SerializedGame, end: SerializedGame};

/**
 * Finished games this server keeps outside its database (e.g. received from other servers): asked by api/replay
 * when the database does not know the id. Undefined = not one of its games.
 */
export type ReplayGamesSource = (participantId: ParticipantId) => Promise<ReplayGames | undefined>;

export type ServerExtension = {
  name: string,
  /** Extra routes: path (as in paths.ts, without leading slash) → handler */
  routes?: ReadonlyArray<readonly [string, IHandler]>,
  /** Feedback goes to the server instead of a GitHub issue (Admin → Settings → Feedback) */
  feedbackDelivery?: FeedbackDelivery,
  /** Replays of finished games outside the database (see ReplayGamesSource) */
  replayGames?: ReplayGamesSource,
};
