
import {Color} from '../Color';
import {PlayerId, GameId, SpectatorId} from '../Types';
import {Phase} from '../Phase';
import {GameOptionsModel} from './GameOptionsModel';
import {AiLevel} from '../ai/AiLevel';

export type SimpleGameModel = {
    activePlayer: Color;
    id: GameId;
    name: string;
    phase: Phase;
    players: Array<SimplePlayerModel>;
    spectatorId: SpectatorId;
    gameOptions: GameOptionsModel;
    lastSoloGeneration: number;
    expectedPurgeTimeMs: number;
}

type SimplePlayerModel = {
    color: Color;
    id: PlayerId;
    name: string;
    /** Present for computer-controlled players: their page is watch-only. */
    aiLevel?: AiLevel;
}
