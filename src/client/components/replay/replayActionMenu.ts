import {CardName} from '@/common/cards/CardName';
import {MILESTONE_COST} from '@/common/constants';
import {CardType} from '@/common/cards/CardType';
import {CardModel} from '@/common/models/CardModel';
import {OrOptionsModel, PlayerInputModel, SelectCardModel, SelectOptionModel, SelectProjectCardToPlayModel} from '@/common/models/PlayerInputModel';
import {LogMessageDataType} from '@/common/logs/LogMessageDataType';
import {ReplaySourceModel} from '@/common/models/ReplaySourceModel';
import {getCard} from '@/client/cards/ClientCardManifest';
import {SELECT_CEO_TITLE, SELECT_CORPORATION_TITLE} from '@/common/inputs/SelectInitialCards';
import {ReplayPlayerState, ReplayState} from './reconstructReplay';
import {ReplayStep} from './replaySteps';
import {Color} from '@/common/Color';
import {ReplayMilestone, replayCanAffordProject, replayCardPlayable, replayClaimableMilestones, replayGreeneryPlants, replayMegacredits} from './replayPlayable';

// The action tabs of the replay: the same menu the server offers a player on their turn (Player.getActions), rebuilt
// from the reconstructed state, and what the player chose in a step. The replay opens that tab and marks the card,
// milestone or award, so one sees where in the game's own interface the action happened.

// Titles exactly as the server writes them: tab labels, icons and order come from these (orOptionsShortLabels.ts)
export const REPLAY_TAB = {
  milestone: 'Claim a milestone',
  plants: 'Convert ${0} plants into greenery',
  heat: 'Convert 8 heat into temperature',
  cardAction: 'Perform an action from a played card',
  playCard: 'Play project card',
  endTurn: 'End Turn',
  award: 'Fund an award (${0} M€)',
  standardProjects: 'Standard projects',
  pass: 'Pass for this generation',
  sell: 'Sell patents',
  // Start of the game: chosen like in the game's own selection, not from the action menu
  corporation: SELECT_CORPORATION_TITLE,
  prelude: 'Select prelude card to play',
  ceo: SELECT_CEO_TITLE,
} as const;
// Tabs that only exist for the step that uses them
const START_TABS: ReadonlyArray<ReplayTab> = [REPLAY_TAB.corporation, REPLAY_TAB.prelude, REPLAY_TAB.ceo];
export type ReplayTab = typeof REPLAY_TAB[keyof typeof REPLAY_TAB];

export type ReplayActionFocus = {
  tab: ReplayTab,
  // Cards the action was about (played, used, sold, standard project)
  cards: ReadonlyArray<CardName>,
  // Milestone or award
  item?: string,
  // Cards that came into the hand (drawn, bought, kept): shown in the hand after the step, marked but not selected
  added?: boolean,
};

// Standard projects when an older server didn't send the game's list (base game)
const BASE_STANDARD_PROJECTS: ReadonlyArray<CardName> = [
  CardName.POWER_PLANT_STANDARD_PROJECT, CardName.ASTEROID_STANDARD_PROJECT, CardName.AQUIFER_STANDARD_PROJECT,
  CardName.GREENERY_STANDARD_PROJECT, CardName.CITY_STANDARD_PROJECT,
];
const AWARD_COSTS = [8, 14, 20];
const HEAT_FOR_TEMPERATURE = 8;

const valueAt = (step: ReplayStep, source: ReplaySourceModel, index: number) => String(source.log[step.line]?.data[index]?.value ?? '');

// Tab of a played card by its type: projects from the hand, the rest at the start of the game
const PLAYED_TABS = new Map<CardType | undefined, ReplayTab>([
  [CardType.ACTIVE, REPLAY_TAB.playCard], [CardType.AUTOMATED, REPLAY_TAB.playCard], [CardType.EVENT, REPLAY_TAB.playCard],
  [CardType.CORPORATION, REPLAY_TAB.corporation], [CardType.PRELUDE, REPLAY_TAB.prelude], [CardType.CEO, REPLAY_TAB.ceo],
]);

// What the actor of a step chose, as a tab and its entry; undefined for steps that are no own action (generation start …)
export function replayActionFocus(source: ReplaySourceModel, step: ReplayStep): ReplayActionFocus | undefined {
  const message = source.log[step.line]?.message;
  const value = valueAt(step, source, 1);
  switch (message) {
  case '${0} played ${1}':
  case '${0} played ${1} [ ${2} ]': {
    const tab = PLAYED_TABS.get(getCard(value as CardName)?.type);
    return tab === undefined ? undefined : {tab, cards: [value as CardName]};
  }
  case '${0} used ${1} action':
    return {tab: REPLAY_TAB.cardAction, cards: [value as CardName]};
  case '${0} used ${1} standard project': {
    if (value === CardName.SELL_PATENTS_STANDARD_PROJECT) {
      return {tab: REPLAY_TAB.sell, cards: soldCards(source, step)};
    }
    return {tab: REPLAY_TAB.standardProjects, cards: [value as CardName]};
  }
  case '${0} used ${1} standard action':
    return value === CardName.CONVERT_PLANTS ? {tab: REPLAY_TAB.plants, cards: []} :
      value === CardName.CONVERT_HEAT ? {tab: REPLAY_TAB.heat, cards: []} : undefined;
  case '${0} passed':
    return {tab: REPLAY_TAB.pass, cards: []};
  case '${0} ended turn':
    return {tab: REPLAY_TAB.endTurn, cards: []};
  case '${0} ${1} ${2} card(s)':
  case '${0} kept ${1} project cards':
  case '${0} drew ${1}':
  case '${0} bought ${1}':
    return {tab: REPLAY_TAB.playCard, cards: addedCards(source, step), added: true};
  case '${0} claimed ${1} milestone':
    return {tab: REPLAY_TAB.milestone, cards: [], item: value};
  case '${0} funded ${1} award':
    return {tab: REPLAY_TAB.award, cards: [], item: value};
  default:
    return undefined;
  }
}

// Sold cards stand in a private line of the same step ("${0} sold ${1}")
function soldCards(source: ReplaySourceModel, step: ReplayStep): Array<CardName> {
  const lines = source.log.slice(step.line, step.state + 1);
  const line = lines.find((message) => message.message === '${0} sold ${1}');
  const value = line?.data[line.data.length - 1]?.value;
  return (Array.isArray(value) ? value : [value]).filter((card): card is CardName => typeof card === 'string');
}

// Cards the actor got in this step: public lines name them for everyone, private lines only for the actor
const ADDED_LINES = new Set(['${0} drew ${1}', '${0} bought ${1}']);
function addedCards(source: ReplaySourceModel, step: ReplayStep): Array<CardName> {
  return source.log.slice(step.line, step.state + 1)
    .filter((message) => ADDED_LINES.has(message.message) && (message.viewer === undefined || message.viewer === step.actor))
    .flatMap((message) => {
      const value = message.data[message.data.length - 1]?.value;
      return Array.isArray(value) ? value : [value];
    })
    .filter((card): card is CardName => typeof card === 'string');
}

const cardModel = (name: CardName, isDisabled = false): CardModel => ({name, calculatedCost: getCard(name)?.cost, ...(isDisabled ? {isDisabled} : {})});
const option = (title: string, buttonLabel: string): SelectOptionModel => ({type: 'option', title, buttonLabel});
const cardList = (title: string, buttonLabel: string, cards: Array<CardModel>, extra: Partial<SelectCardModel> = {}): SelectCardModel => ({
  type: 'card', title, buttonLabel, cards, min: 0, max: cards.length,
  showOnlyInLearnerMode: false, selectBlueCardAction: false, showOwner: false, showSelectAll: false, ...extra,
});
const projectCards = (title: string, buttonLabel: string, cards: Array<CardModel>): SelectProjectCardToPlayModel => ({
  type: 'projectCard', title, buttonLabel, cards, paymentOptions: {},
  microbes: 0, floaters: 0, lunaArchivesScience: 0, seeds: 0, graphene: 0, kuiperAsteroids: 0, auroraiData: 0, spireScience: 0,
});

/**
 * The action menu of a player before a step, in the server's order and with its conditions (replayPlayable.ts).
 * `before` is the game state before the step (the hand still holds the card about to be played). The tab of `focus`
 * is preselected, and its milestone or award; what the player chose is always offered.
 */
export function replayActionMenu(
  source: ReplaySourceModel,
  before: ReplayState,
  player: ReplayPlayerState,
  color: Color,
  milestones: ReadonlyArray<ReplayMilestone>,
  awardNames: ReadonlyArray<string>,
  focus: ReplayActionFocus | undefined,
  checkCosts = true): OrOptionsModel {
  const options: Array<PlayerInputModel> = [];
  // The dealt choice isn't known, only the chosen card
  if (focus !== undefined && START_TABS.includes(focus.tab)) {
    options.push(cardList(focus.tab, 'Confirm', focus.cards.map((name) => cardModel(name)), {max: 1, min: 1}));
  }
  const claimable = replayClaimableMilestones(milestones, before, player, color, checkCosts);
  const openMilestones = milestones.map((milestone) => milestone.name)
    .filter((name) => claimable.includes(name) || (focus?.tab === REPLAY_TAB.milestone && focus.item === name));
  if (openMilestones.length > 0) {
    const milestones: OrOptionsModel = {type: 'or', title: REPLAY_TAB.milestone, buttonLabel: 'Confirm',
      options: openMilestones.map((name) => option(name, 'Claim - (' + name + ')'))};
    milestones.initialIdx = Math.max(0, openMilestones.indexOf(focus?.item ?? ''));
    options.push(milestones);
  }
  const plants = replayGreeneryPlants(player);
  if (player.resources[3] >= plants || focus?.tab === REPLAY_TAB.plants) {
    options.push({...option(REPLAY_TAB.plants, 'Confirm'), title: {message: REPLAY_TAB.plants, data: [{type: LogMessageDataType.RAW_STRING, value: String(plants)}]}});
  }
  // Like in the game also at maximum temperature (no step, no TR, the server only warns)
  if (player.resources[5] >= HEAT_FOR_TEMPERATURE || focus?.tab === REPLAY_TAB.heat) {
    options.push(option(REPLAY_TAB.heat, 'Convert heat'));
  }
  const actionCards = player.played.filter((name) => getCard(name)?.hasAction === true);
  if (actionCards.length > 0) {
    // Actions used this generation are greyed out like in the game – except the one used in this step
    options.push(cardList(REPLAY_TAB.cardAction, 'Take action',
      actionCards.map((name) => cardModel(name, player.actionsThisGeneration.includes(name) && !focus?.cards.includes(name))),
      {max: 1, min: 1, selectBlueCardAction: true}));
  }
  // Only cards the player could play; the others show greyed out below (unplayableHandCards)
  const playable = player.hand.filter((name) => replayCardPlayable(name, before, player, checkCosts) || (focus?.tab === REPLAY_TAB.playCard && focus.cards.includes(name)));
  if (playable.length > 0) {
    options.push(projectCards(REPLAY_TAB.playCard, 'Play card', playable.map((name) => cardModel(name))));
  }
  if (focus?.tab === REPLAY_TAB.endTurn) {
    options.push(option(REPLAY_TAB.endTurn, 'End'));
  }
  const openAwards = awardNames.filter((name) => !before.awards.some((funded) => funded.name === name));
  const cost = AWARD_COSTS[before.awards.length];
  if (openAwards.length > 0 && cost !== undefined && (!checkCosts || replayMegacredits(player) >= cost || focus?.tab === REPLAY_TAB.award)) {
    const awards: OrOptionsModel = {
      type: 'or',
      title: {message: REPLAY_TAB.award, data: [{type: LogMessageDataType.RAW_STRING, value: String(cost)}]},
      buttonLabel: 'Confirm',
      options: openAwards.map((name) => option(name, 'Fund - (' + name + ')')),
    };
    awards.initialIdx = Math.max(0, openAwards.indexOf(focus?.item ?? ''));
    options.push(awards);
  }
  const standardProjects = source.standardProjects !== undefined && source.standardProjects.length > 0 ? source.standardProjects : BASE_STANDARD_PROJECTS;
  options.push(projectCards(REPLAY_TAB.standardProjects, 'Confirm',
    standardProjects.filter((name) => name !== CardName.SELL_PATENTS_STANDARD_PROJECT)
      .map((name) => cardModel(name, !replayCanAffordProject(name, player, checkCosts) && !focus?.cards.includes(name)))));
  options.push(option(REPLAY_TAB.pass, 'Pass'));
  if (player.hand.length > 0) {
    options.push(cardList(REPLAY_TAB.sell, 'Sell', player.hand.map((name) => cardModel(name))));
  }

  const focusIndex = focus === undefined ? -1 : options.findIndex((entry) => titleOf(entry) === focus.tab);
  const playIndex = options.findIndex((entry) => titleOf(entry) === REPLAY_TAB.playCard);
  return {
    type: 'or',
    title: 'Take your next action',
    buttonLabel: 'Take action',
    options,
    initialIdx: focusIndex >= 0 ? focusIndex : Math.max(0, playIndex),
  };
}

const titleOf = (input: PlayerInputModel): string => typeof input.title === 'string' ? input.title : input.title.message;

/**
 * Whether the reconstructed money of a game can decide what a player could afford: only when every card, milestone,
 * award and standard project actually bought in the game was affordable in the reconstruction. Games whose log lacks
 * payments (older servers) otherwise would hide options the player had.
 */
export function replayMoneyReliable(source: ReplaySourceModel, states: ReadonlyArray<ReplayState>, steps: ReadonlyArray<ReplayStep>): boolean {
  const colors = source.players.map((entry) => entry.color);
  return steps.every((step) => {
    const focus = replayActionFocus(source, step);
    const index = step.actor === undefined ? -1 : colors.indexOf(step.actor);
    if (focus === undefined || focus.added === true || index < 0) {
      return true;
    }
    const before = states[Math.max(0, step.line - 1)];
    const player = before?.players[index];
    if (player === undefined) {
      return true;
    }
    switch (focus.tab) {
    case REPLAY_TAB.playCard:
      return focus.cards.every((name) => replayCardPlayable(name, before, player) || !replayCardPlayable(name, before, player, false));
    case REPLAY_TAB.standardProjects:
      return focus.cards.every((name) => replayCanAffordProject(name, player));
    case REPLAY_TAB.milestone:
      return replayMegacredits(player) >= MILESTONE_COST;
    case REPLAY_TAB.award:
      return replayMegacredits(player) >= (AWARD_COSTS[before.awards.length] ?? 0);
    default:
      return true;
    }
  });
}

