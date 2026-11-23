// What the Rust bot needs to mirror a game: the setup in its text form (the lab repo's core/src/rules.rs
// Options::parse) and the dealt state right after Game.newInstance. The lab repo's recorder writes the same.
import {IGame} from '../../IGame';
import {GameOptions} from '../../game/GameOptions';
import {BoardName} from '../../../common/boards/BoardName';
import {RandomMAOptionType} from '../../../common/ma/RandomMAOptionType';

// Rust board names (its data/board-<name>.json) by TS board name
const BOARDS: Partial<Record<string, string>> = {
  [BoardName.THARSIS]: 'tharsis', [BoardName.HELLAS]: 'hellas', [BoardName.ELYSIUM]: 'elysium',
  [BoardName.UTOPIA_PLANITIA]: 'utopia-planitia', [BoardName.VASTITAS_BOREALIS_NOVA]: 'vastitas-borealis-nova',
  [BoardName.TERRA_CIMMERIA_NOVA]: 'terra-cimmeria-nova', [BoardName.AMAZONIS_PLANITIA]: 'amazonis-planitia',
  [BoardName.ARABIA_TERRA]: 'arabia-terra', [BoardName.VASTITAS_BOREALIS]: 'vastitas-borealis',
  [BoardName.AMAZONIS]: 'amazonis-p', [BoardName.TERRA_CIMMERIA]: 't-cimmeria', [BoardName.HOLLANDIA]: 'hollandia',
  'Arrakis 61': 'arrakis-61', 'Arrakis 91': 'arrakis-91',
};

// On/off options the Rust rules know, and their flags
const SWITCHES: Array<[keyof GameOptions, string]> = [
  ['prelude2Expansion', 'prelude2'], ['venusNextExtension', 'venus'], ['solarPhaseOption', 'wgt'],
  ['coloniesExtension', 'colonies'], ['turmoilExtension', 'turmoil'], ['promoCardsOption', 'promo'],
  ['initialDraftVariant', 'initialdraft'], ['preludeDraftVariant', 'preludedraft'], ['includeFanMA', 'fanma'],
  ['requiresVenusTrackCompletion', 'venusend'], ['removeNegativeGlobalEventsOption', 'nonegative'],
  ['altVenusBoard', 'altvenus'], ['twoCorpsVariant', 'twocorps'], ['shuffleMapOption', 'shufflemap'],
];

// Options that change nothing the bot plays (display, timers, analysis log, deal sizes at their default)
const NEUTRAL = new Set<string>([
  'boardName', 'bannedCards', 'includedCards', 'clonedGamedId', 'corporateEra', 'draftVariant', 'preludeExtension',
  'expansions', 'fastModeOption', 'showOtherPlayersVP', 'showTimers', 'aiAnalysis', 'undoOption', 'randomMA',
  'politicalAgendasExtension', 'startingCorporations', 'startingPreludes', 'startingCeos', 'aresHazards', 'name',
  'theme', 'duneModules', 'customMA',
  ...SWITCHES.map(([option]) => option),
]);

/**
 * The setup in the Rust text form, or a reason why the Rust bot cannot play it (an expansion or variant it does
 * not know). The caller keeps the TS AI for such games.
 */
export function rustOptionsText(options: GameOptions, playerCount: number): {text: string} | {unsupported: string} {
  const board = BOARDS[options.boardName];
  if (board === undefined) {
    return {unsupported: `board ${options.boardName}`};
  }
  if (playerCount < 2 || playerCount > 6) {
    return {unsupported: `${playerCount} players`};
  }
  if (options.corporateEra !== true) {
    return {unsupported: 'without corporate era'};
  }
  if (options.bannedCards.length > 0 || options.includedCards.length > 0 || options.customMA !== undefined) {
    return {unsupported: 'custom card or milestone lists'};
  }
  const record = options as unknown as Record<string, unknown>;
  for (const [option, value] of Object.entries(record)) {
    if (NEUTRAL.has(option) || value === false || value === undefined) {
      continue;
    }
    if (Array.isArray(value) && value.length === 0) {
      continue;
    }
    if ((option === 'startingCorporations' || option === 'startingPreludes') && value === undefined) {
      continue;
    }
    return {unsupported: option};
  }
  const flags: Array<string> = [];
  if (board !== 'tharsis') {
    flags.push(`board=${board}`);
  }
  if (playerCount !== 2) {
    flags.push(`players=${playerCount}`);
  }
  if (!options.draftVariant) {
    flags.push('nodraft');
  }
  if (!options.preludeExtension) {
    flags.push('noprelude');
  }
  for (const [option, flag] of SWITCHES) {
    if (options[option] === true) {
      flags.push(flag);
    }
  }
  if (options.randomMA === RandomMAOptionType.LIMITED) {
    flags.push('randomma');
  } else if (options.randomMA === RandomMAOptionType.UNLIMITED) {
    flags.push('fullrandomma');
  } else if (options.randomMA !== RandomMAOptionType.NONE) {
    return {unsupported: `random milestones ${options.randomMA}`};
  }
  if (options.politicalAgendasExtension === 'Chairman') {
    flags.push('agendas=chairman');
  } else if (options.politicalAgendasExtension === 'Random') {
    flags.push('agendas=random');
  }
  const modules = record.duneModules;
  if (Array.isArray(modules) && modules.length > 0) {
    flags.push(`modules=${[...modules].sort().join('+')}`);
  }
  return {text: flags.join(',')};
}

/** [bonus, policy] of every party's agenda (political agendas), in party order. */
function agendaIndexes(turmoil: any): Array<[number, number]> {
  return turmoil.parties.map((party: any) => {
    const agenda = turmoil.politicalAgendasData.agendas.get(party.name);
    return [Number(agenda.bonusId.slice(-2)) - 1, Number(agenda.policyId.slice(-2)) - 1];
  });
}

/** The dealt state right after Game.newInstance, as the Rust bot's `setup` request expects it. */
export function setupOf(game: IGame, optionsText: string, duneRandom: Array<number>): Record<string, unknown> {
  const anyGame = game as any;
  return {
    seed: 1,
    options: optionsText,
    colors: game.players.map((player) => player.color),
    // TS draws the first player at random; the Rust game starts with seat 0 unless told otherwise
    firstPlayer: game.players.indexOf(game.first),
    // names the bot's decision log (TM_DECISION_LOG/<gameId>.jsonl)
    gameId: game.id,
    duneRandom,
    players: game.players.map((player: any) => ({
      corporations: player.dealtCorporationCards.map((card: any) => card.name),
      preludes: player.dealtPreludeCards.map((card: any) => card.name),
      cards: player.dealtProjectCards.map((card: any) => card.name),
      draftHand: player.draftHand.map((card: any) => card.name),
    })),
    // bottom first; TS draws from the end
    drawPile: anyGame.projectDeck.drawPile.map((card: any) => card.name),
    preludePile: anyGame.preludeDeck.drawPile.map((card: any) => card.name),
    corporationPile: anyGame.corporationDeck.drawPile.map((card: any) => card.name),
    milestoneNames: game.milestones.map((milestone) => milestone.name),
    awardNames: game.awards.map((award) => award.name),
    boardSpaces: game.gameOptions.shuffleMapOption ? game.board.spaces.map((space: any) => {
      const costs = anyGame.board.spaceCosts(space);
      return {id: space.id, spaceType: space.spaceType, bonus: space.bonus, cost: costs.megacredits, costTr: costs.tr};
    }) : undefined,
    colonies: game.colonies.map((colony) => colony.name),
    turmoil: game.turmoil === undefined ? null : {
      deck: anyGame.turmoil.globalEventDealer.deck.map((event: any) => event.name),
      coming: game.turmoil.comingGlobalEvent?.name ?? null,
      distant: game.turmoil.distantGlobalEvent?.name ?? null,
      agendas: agendaIndexes(game.turmoil),
    },
  };
}
