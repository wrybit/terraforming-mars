import {BaseMilestone} from '../../milestones/IMilestone';
import {IPlayer} from '../../IPlayer';
import {schemeAgenda, schemeLevel} from '../../../common/dune/schemeAgendas';
import {schemeValue} from '../Schemes';

// Milestone of the schemes module (common/dune/duneGoals.ts): the medium level of one of the own agendas
export class Schemer extends BaseMilestone {
  constructor() {
    super(
      'Schemer',
      'Reach the medium level of one of your agendas',
      2);
  }

  public getScore(player: IPlayer): number {
    const names = player.game.duneData?.schemes?.agendas[player.id] ?? [];
    return Math.max(0, ...names.map((name) => {
      const agenda = schemeAgenda(name);
      return schemeLevel(agenda, schemeValue(player, agenda.measure));
    }));
  }
}
