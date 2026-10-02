import {ParticipantId} from '../../common/Types';

// isPlayerId/isSpectatorId prüfen nur den ersten Buchstaben. Für Importe wird die ID zu einem Dateinamen und einer
// fremden URL – deshalb hier streng: nur p/s gefolgt von Buchstaben, Ziffern und Bindestrich.
const importableParticipantIdPattern = /^[ps][0-9a-zA-Z-]{1,64}$/;

export function isImportableParticipantId(id: string): id is ParticipantId {
  return importableParticipantIdPattern.test(id);
}
