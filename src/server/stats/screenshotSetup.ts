import {ALL_MODULE_MANIFESTS} from '../cards/AllManifests';
import {CardName} from '../../common/cards/CardName';
import {Expansion, GameModule} from '../../common/cards/GameModule';
import {StatsGameDetails} from '../../common/stats/StatsGame';
import {GameSetupOptions} from '../../common/game/GameSetupOptions';
import {RandomMAOptionType} from '../../common/ma/RandomMAOptionType';

// A screenshot of the results page shows no settings, but some can be read off what it does show:
// every visible card and corporation proves its expansion, the shuffled board is recognized by the ocean
// layout (screenshot analysis) and the time column only exists with timers. Everything else stays unknown
// and therefore off – the chips then show what is certain, never a guess.

let moduleByCard: Map<CardName, GameModule> | undefined;

function moduleOf(card: CardName): GameModule | undefined {
  if (moduleByCard === undefined) {
    moduleByCard = new Map();
    for (const manifest of ALL_MODULE_MANIFESTS) {
      const names = [manifest.projectCards, manifest.corporationCards, manifest.preludeCards, manifest.ceoCards]
        .flatMap((cards) => Object.keys(cards) as Array<CardName>);
      for (const name of names) {
        // A card listed in several manifests counts for the first one (base before expansions)
        if (!moduleByCard.has(name)) {
          moduleByCard.set(name, manifest.module);
        }
      }
    }
  }
  return moduleByCard.get(card);
}

/** Screenshot details plus what the visible cards, corporations and columns reveal about the setup. */
export function withScreenshotSetup(details: StatsGameDetails, corporations: ReadonlyArray<CardName>): StatsGameDetails {
  const expansions = new Set<Expansion>(details.expansions);
  const cards = [...corporations, ...details.players.flatMap((player) => player.cards)];
  for (const card of cards) {
    const module = moduleOf(card);
    if (module !== undefined && module !== 'base') {
      expansions.add(module);
    }
  }
  // Two corporations for one player only happen with Merger, a Prelude card
  const merger = corporations.length > details.players.length;
  if (merger) {
    expansions.add('prelude');
  }
  const options: GameSetupOptions = {
    shuffledBoard: details.shuffledBoard === true,
    altVenusBoard: false,
    requiresVenusTrackCompletion: false,
    politicalAgendasExtension: 'Standard',
    removeNegativeGlobalEvents: false,
    requiresMoonTrackCompletion: false,
    moonStandardProjectVariant1: false,
    moonStandardProjectVariant: false,
    aresExtremeVariant: false,
    startingCorporations: undefined,
    startingPreludes: undefined,
    startingCeos: undefined,
    twoCorpsVariant: merger,
    draftVariant: false,
    initialDraftVariant: false,
    preludeDraftVariant: false,
    ceosDraftVariant: false,
    solarPhaseOption: false,
    soloTR: false,
    undoOption: false,
    showTimers: details.players.length > 0 && details.players.every((player) => player.timeSeconds !== undefined && player.timeSeconds !== null),
    showOtherPlayersVP: false,
    fastModeOption: false,
    escapeVelocity: false,
    randomMA: RandomMAOptionType.NONE,
    modularMA: false,
    includeFanMA: false,
    customCardPool: false,
  };
  return {...details, expansions: [...expansions], options};
}
