import * as json_constants from '@/client/components/create/json';
import {DUNE_MODULE_FIELD} from './duneModuleFields';
import {Expansion} from '@/common/cards/GameModule';
import {JSONObject, JSONValue} from '../../../common/Types';
import {CreateGameModel} from './CreateGameModel';
import {PLAYER_COLORS} from '@/common/Color';
import {NewPlayerModel} from '@/common/game/NewGameConfig';
import {CardName} from '@/common/cards/CardName';
import {cast} from '@/common/utils/utils';
import {CARD_RENAMES} from '@/common/cards/CardRenames';
import {sanitizeEscapeVelocityOptions} from '@/common/game/escapeVelocity';
import {translateText, translateTextWithParams} from '@/client/directives/i18n';

function safeBoolean(val: JSONValue): boolean {
  if (typeof val === 'boolean') {
    return val;
  }
  throw new Error(`${val} is not boolean`);
}

export class JSONProcessor {
  public model: CreateGameModel;
  public warnings: Array<string>;
  public solarPhaseOption: boolean = false;
  public bannedCards: Array<CardName> = [];
  public includedCards: Array<CardName> = [];

  constructor(model: CreateGameModel) {
    this.model = model;
    this.warnings = [];
  }

  public applyJSON(json: JSONObject) {
    json = JSON.parse(JSON.stringify(json)); // Make a copy so as to not change the original data.

    const players = cast(json['players'], Array<NewPlayerModel>);
    const validationErrors = this.validatePlayers(players);
    if (validationErrors.length > 0) {
      throw new Error(validationErrors.join('\n'));
    }

    if (json.corporationsDraft !== undefined) {
      this.warnings.push(translateText('Corporations draft is no longer available. Future versions might just raise an error, so edit your JSON file.'));
    }

    // Ensures that outdated array fields are still applied.
    function initializeArrayFieldWithBackup(oldFieldName: string, newFieldName: string) {
      const oldValue = json[oldFieldName];
      const newValue = json[newFieldName];

      if (newValue === undefined || cast(newValue, Array).length === 0) {
        json[newFieldName] = oldValue || [];
      }
    }
    initializeArrayFieldWithBackup(json_constants.OLD_CUSTOM_CORPORATIONS, json_constants.CUSTOM_CORPORATIONS);
    initializeArrayFieldWithBackup(json_constants.OLD_CUSTOM_COLONIES, json_constants.CUSTOM_COLONIES);
    initializeArrayFieldWithBackup(json_constants.OLD_BANNED_CARDS, json_constants.BANNED_CARDS);
    const ev = json.escapeVelocity as JSONObject;
    if (ev !== undefined && typeof ev === 'object') {
      const options = sanitizeEscapeVelocityOptions(ev);
      json.escapeVelocityMode = true;
      json.escapeVelocityBonusSeconds = options.bonusSectionsPerAction;
      json.escapeVelocityPenalty = options.penaltyVPPerPeriod;
      json.escapeVelocityPeriod = options.penaltyPeriodMinutes;
      json.escapeVelocityThreshold = options.thresholdMinutes;
    }

    // Dune expansion: the config lists the modules, the form has one switch per module
    if (Array.isArray(json.duneModules)) {
      const modules = json.duneModules as Array<unknown>;
      for (const [module, field] of Object.entries(DUNE_MODULE_FIELD)) {
        json[field] = modules.includes(module);
      }
    }

    function set<T>(field: string): Array<T> {
      return cast(json[field] ?? [], Array) as Array<T>;
    }

    this.bannedCards = set(json_constants.BANNED_CARDS);
    this.includedCards = set(json_constants.INCLUDED_CARDS);

    this.model.playersCount = players.length;
    this.model.showBannedCards = this.bannedCards.length > 0;
    this.model.showIncludedCards = this.includedCards.length > 0;

    const oldExpansionFields: Record<Expansion, string> = {
      corpera: json_constants.CORPORATEERA,
      promo: json_constants.PROMOCARDSOPTION,
      venus: json_constants.VENUSNEXT,
      colonies: json_constants.COLONIES,
      prelude: json_constants.PRELUDE,
      prelude2: json_constants.PRELUDE2EXPANSION,
      turmoil: json_constants.TURMOIL,
      community: json_constants.COMMUNITYCARDSOPTION,
      ares: json_constants.ARESEXTENSION,
      moon: json_constants.MOONEXPANSION,
      pathfinders: json_constants.PATHFINDERSEXPANSION,
      ceo: json_constants.CEOEXTENSION,
      starwars: json_constants.STARWARSEXPANSION,
      underworld: json_constants.UNDERWORLDEXPANSION,
      deltaProject: json_constants.DELTA_PROJECT_EXPANSION,
    } as const;
    for (const expansion of Object.keys(oldExpansionFields)) {
      const x = oldExpansionFields[expansion as Expansion];
      const val = json[x];
      if (typeof(val) === 'boolean') {
        this.model.expansions[expansion as Expansion] = val;
      }
    }

    // Capture the solar phase option since several of the other results will change
    // it via the watch mechanism.
    this.solarPhaseOption = safeBoolean(json.solarPhaseOption);

    const ignoredFields = [
      // Instead of ignoring these fields, let them pass through to the model.
      // json_constants.CUSTOM_CORPORATIONS,
      // json_constants.CUSTOM_COLONIES,
      // json_constants.CUSTOM_PRELUDES,
      // json_constants.BANNED_CARDS,
      // json_constants.INCLUDED_CARDS,
      json_constants.OLD_BANNED_CARDS,
      json_constants.OLD_CUSTOM_COLONIES,
      json_constants.OLD_CUSTOM_CORPORATIONS,
      ...Object.values(oldExpansionFields),
      'escapeVelocity',
      'duneModules',
      'players',
      'solarPhaseOption',
      'constants'];
    for (const k in json) {
      if (ignoredFields.includes(k)) {
        continue;
      }
      if (k in this.model) {
        // This is safe because of the in check, above.
        (this.model as any)[k] = json[k];
      } else {
        this.warnings.push(translateTextWithParams('Unknown property: ${0}', [k]));
      }
    }

    for (let i = 0; i < players.length; i++) {
      this.model.players[i] = players[i];
    }

    this.validateCardNames('customCorporations', this.model.customCorporations);
    this.validateCardNames('customPreludes', this.model.customPreludes);
    this.validateCardNames('customCeos', this.model.customCeos);
    this.validateCardNames('bannedCards', this.bannedCards);
    this.validateCardNames('includedCards', this.includedCards);
  }

  private validateCardNames(fieldLabel: string, names: ReadonlyArray<CardName>): void {
    const validNames = new Set<string>(Object.values(CardName));
    for (const name of names) {
      if (!validNames.has(name)) {
        const canonical = CARD_RENAMES.get(name);
        if (canonical !== undefined) {
          this.warnings.push(translateTextWithParams('Old card name \'${0}\' in ${1}; use \'${2}\'', [name, fieldLabel, canonical]));
        } else {
          this.warnings.push(translateTextWithParams('Unknown card name \'${0}\' in ${1}', [name, fieldLabel]));
        }
      }
    }
  }

  private validatePlayers(players: Array<NewPlayerModel>): Array<string> {
    const errors = [];

    // Ensure colors are valid and distinct
    const colors = new Set(players.map((p) => p.color));
    for (const color of colors) {
      // `as any` is OK here since this just validates `color`.
      if (PLAYER_COLORS.indexOf(color as any) === -1) {
        errors.push(translateTextWithParams('${0} is not a color', [color]));
      }
    }
    if (colors.size !== players.length) {
      errors.push(translateText('Colors are duplicated'));
    }
    return errors;
  }
}
