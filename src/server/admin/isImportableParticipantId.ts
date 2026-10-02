import {ParticipantId} from '../../common/Types';

// isPlayerId/isSpectatorId only check the first letter. For imports the ID becomes a file name and part of a
// foreign URL – hence strict here: only p/s followed by letters, digits and hyphens.
const importableParticipantIdPattern = /^[ps][0-9a-zA-Z-]{1,64}$/;

export function isImportableParticipantId(id: string): id is ParticipantId {
  return importableParticipantIdPattern.test(id);
}
