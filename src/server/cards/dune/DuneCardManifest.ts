import {CardName} from '../../../common/cards/CardName';
import {ModuleManifest} from '../ModuleManifest';
import {BazaarConcession} from './BazaarConcession';
import {CaravanMaster} from './CaravanMaster';
import {MentatCalculation} from './MentatCalculation';
import {TleilaxuSpy} from './TleilaxuSpy';
import {Thumper} from './Thumper';
import {WormRider} from './WormRider';
import {DuneStabiliser} from './DuneStabiliser';
import {ChoamDirectorate} from './ChoamDirectorate';
import {GuildBank} from './GuildBank';
import {SmugglerNetwork} from './SmugglerNetwork';
import {FriendsOfEsmarTuek} from './FriendsOfEsmarTuek';
import {SardaukarRaid} from './SardaukarRaid';
import {SardaukarMercenaries} from './SardaukarMercenaries';
import {ShieldGenerator} from './ShieldGenerator';
import {WaterOfLife} from './WaterOfLife';
import {StillsuitFactory} from './StillsuitFactory';

// Cards of the Dune expansion. Not an expansion of its own: GameCards adds them when the matching module is on
// (DUNE_CARD_MODULES in dune/DuneExpansion.ts).
export const DUNE_CARD_MANIFEST = new ModuleManifest({
  module: 'dune',
  projectCards: {
    [CardName.BAZAAR_CONCESSION]: {Factory: BazaarConcession},
    [CardName.CARAVAN_MASTER]: {Factory: CaravanMaster},
    [CardName.MENTAT_CALCULATION]: {Factory: MentatCalculation},
    [CardName.TLEILAXU_SPY]: {Factory: TleilaxuSpy},
    [CardName.THUMPER]: {Factory: Thumper},
    [CardName.WORM_RIDER]: {Factory: WormRider},
    [CardName.DUNE_STABILISER]: {Factory: DuneStabiliser},
    [CardName.CHOAM_DIRECTORATE]: {Factory: ChoamDirectorate},
    [CardName.GUILD_BANK]: {Factory: GuildBank},
    [CardName.SMUGGLER_NETWORK]: {Factory: SmugglerNetwork},
    [CardName.FRIENDS_OF_ESMAR_TUEK]: {Factory: FriendsOfEsmarTuek},
    [CardName.SARDAUKAR_RAID]: {Factory: SardaukarRaid},
    [CardName.SARDAUKAR_MERCENARIES]: {Factory: SardaukarMercenaries},
    [CardName.SHIELD_GENERATOR]: {Factory: ShieldGenerator},
    [CardName.WATER_OF_LIFE]: {Factory: WaterOfLife},
    [CardName.STILLSUIT_FACTORY]: {Factory: StillsuitFactory},
  },
});
