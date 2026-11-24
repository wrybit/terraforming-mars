import {IPlayer} from '../IPlayer';
import {PlayerInput} from '../PlayerInput';
import {InputResponse} from '../../common/inputs/InputResponse';
import {AiAdminSettings} from '../../common/ai/aiCompatibility';
import {chooseResponse} from './chooseResponse';
import {quickResponse} from './quickResponse';

/** Answers for an AI player when its own engine has none or the game refuses it, tried in order. */
export type AiStandIn = {name: 'typescript' | 'quick', answer: () => InputResponse | undefined};

/**
 * Who stands in for an AI player, in order. Rust AI players get the TypeScript AI first – unless the admin turned the
 * TypeScript stand-in off (AI_TYPESCRIPT_FALLBACK=false), then a game that started with the Rust AI stays without
 * the TypeScript AI to its end. The quick answer is always last, so the game never stops (random answers follow in
 * processWithFallback). TypeScript AI players decide with chooseResponse already, so only the quick answer stands in.
 */
export function aiStandIns(player: IPlayer, input: PlayerInput, admin: AiAdminSettings): Array<AiStandIn> {
  const standIns: Array<AiStandIn> = [];
  if (player.aiEngine === 'rust' && admin.typescriptFallback) {
    standIns.push({name: 'typescript', answer: () => chooseResponse(input, player, player.aiLevel ?? 'normal')});
  }
  standIns.push({name: 'quick', answer: () => quickResponse(input, player)});
  return standIns;
}
