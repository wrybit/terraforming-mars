import {IPlayer} from '../IPlayer';
import {PlayerInput} from '../PlayerInput';
import {OrOptions} from '../inputs/OrOptions';
import {CHOAM_TITLE} from '../../common/dune/duneActionTitles';
import {DuneData} from './DuneExpansion';
import {ChoamData, choamActions, initializeChoam, pactChoices} from './Choam';
import {
  SmugglingData, aiGuildInput, bribePayment, envyFull, initializeSmuggling, privilegeOf, prophecyOf, raiseEnvy, smuggleInput,
  smugglingActions,
} from './Smuggling';
import {deliverInput} from './Privilege';
import {buyOrderInput, sellOrderInput, withdrawOrderInputs} from './Prophecy';

// The CHOAM module (Jens 24 Oct 2026, _mockups/dune/choam/choam-prototyp.html): smuggling and the CHOAM contracts
// merged into one module with one action tab and five moves – guild, prophecy, privilege, pacts, tribute. Each move
// but the tribute (and taking back an own offer or prophecy) raises the envy of the great houses by 1; at the top of
// the track only the tribute is left. The client finds each move by its title (ChoamExchangeInput.vue).

/** Both halves of the module; games that had only one of the two former modules get the other on first use */
export function choamParts(data: DuneData): {smuggling: SmugglingData, choam: ChoamData} | undefined {
  if (data.smuggling === undefined && data.choam === undefined) {
    return undefined;
  }
  data.smuggling ??= initializeSmuggling();
  data.choam ??= initializeChoam();
  return {smuggling: data.smuggling, choam: data.choam};
}

/** The CHOAM tab of the action menu; the AI only moves spice at the guild there */
export function choamExchangeTabActions(player: IPlayer, data: DuneData): Array<PlayerInput> {
  const parts = choamParts(data);
  if (parts === undefined) {
    return [];
  }
  const {smuggling, choam} = parts;
  if (player.aiLevel !== undefined) {
    const input = aiGuildInput(player, smuggling);
    return input === undefined ? [] : [input];
  }
  const closed = envyFull(smuggling, player);
  const envy = () => raiseEnvy(player, smuggling);
  const prophecy = prophecyOf(smuggling);
  const choices: Array<PlayerInput | undefined> = [
    smuggleInput(player, smuggling, false),
    closed ? undefined : sellOrderInput(player, prophecy, envy),
    closed ? undefined : buyOrderInput(player, prophecy, envy),
    ...withdrawOrderInputs(player, prophecy, () => {}),
    closed ? undefined : deliverInput(player, privilegeOf(player.game, smuggling), envy),
    ...pactChoices(player, choam, envy, closed),
    bribePayment(player, smuggling),
  ];
  const offered = choices.filter((choice): choice is PlayerInput => choice !== undefined);
  return offered.length === 0 ? [] : [new OrOptions(...offered).setTitle(CHOAM_TITLE)];
}

/** CHOAM moves of the Dune group of the action menu: only the AI pays tribute and accepts offers there */
export function choamExchangeActions(player: IPlayer, data: DuneData): Array<PlayerInput> {
  const parts = choamParts(data);
  if (parts === undefined || player.aiLevel === undefined) {
    return [];
  }
  const {smuggling, choam} = parts;
  return [
    ...smugglingActions(player, smuggling),
    ...(envyFull(smuggling, player) ? [] : choamActions(player, choam, () => raiseEnvy(player, smuggling))),
  ];
}
