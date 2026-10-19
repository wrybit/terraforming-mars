import {Color} from '@/common/Color';
import {KanlyModel} from '@/common/dune/DuneModel';
import {battleWinner} from '@/common/dune/kanlyBattle';
import {JOIN_KANLY_TITLE, KANLY_SEND_TITLE} from '@/common/dune/duneActionTitles';
import {Message} from '@/common/logs/Message';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import {AmountConversion} from '@/client/components/amount/amountConversion';
import {duneGraphic} from './duneGraphic';

// Kanly war field as the players see it: everybody's Sardaukar (also the ones about to be sent) and who would hold the
// tile if the generation ended now – the same rule as the server (common/dune/kanlyBattle.ts).

export type KanlyForce = {
  color: Color,
  /** On the war field already */
  sardaukar: number,
  /** About to be sent with the open input (slider) */
  added: number,
  owner: boolean,
  opener: boolean,
};

export type KanlyForecast = {
  forces: Array<KanlyForce>,
  owner: Color | undefined,
  /** Who holds the tile at the end of the generation as things stand: the winner, otherwise the owner */
  holder: Color | undefined,
  /** The tile changes hands */
  changes: boolean,
};

export const SARDAUKAR_ICON = 'res-sardaukar';

/** Every player with Sardaukar on the field, the owner and the opener; the owner first, then in player order */
export function kanlyForecast(kanly: KanlyModel, players: ReadonlyArray<{color: Color}>, added?: {color: Color, amount: number}): KanlyForecast | undefined {
  const battle = kanly.battle;
  if (battle === undefined) {
    return undefined;
  }
  const forces: Array<KanlyForce> = players.map((player) => ({
    color: player.color,
    sardaukar: battle.troops.find((entry) => entry.color === player.color)?.sardaukar ?? 0,
    added: added?.color === player.color ? added.amount : 0,
    owner: battle.owner === player.color,
    opener: battle.opener === player.color,
  }));
  forces.sort((first, second) => Number(second.owner) - Number(first.owner));
  const owner = battle.owner;
  const winner = owner === undefined ? undefined :
    battleWinner(owner, forces.map((force) => ({key: force.color, sardaukar: force.sardaukar + force.added})));
  return {forces, owner, holder: winner ?? owner, changes: winner !== undefined};
}

function titleKey(title: string | Message): string {
  return typeof title === 'string' ? title : title.message;
}

/** Sending Sardaukar (right after opening, or joining later): garrison → war field with the forecast above */
export function isKanlySend(title: string | Message): boolean {
  const key = titleKey(title);
  return key === KANLY_SEND_TITLE || key === JOIN_KANLY_TITLE;
}

export function kanlySendConversion(title: string | Message, playerView: PlayerViewModel): AmountConversion | undefined {
  const kanly = playerView.game?.dune?.kanly;
  if (!isKanlySend(title) || kanly?.battle === undefined) {
    return undefined;
  }
  const color = playerView.thisPlayer.color;
  const icon = duneGraphic(SARDAUKAR_ICON);
  return {
    from: {kind: 'figure', label: 'Garrison', icon, perStep: 1, before: kanly.garrisons.find((entry) => entry.color === color)?.sardaukar ?? 0},
    to: {kind: 'figure', label: 'War field', icon, perStep: 1, before: kanly.battle.troops.find((entry) => entry.color === color)?.sardaukar ?? 0},
    buttonLabel: 'Send ${0} Sardaukar',
  };
}
