import {expect} from 'chai';
import {aiColorsOf, aiTargetOfRow, decisionSummaries} from '@/client/components/logpanel/aiAnalysis/aiLogTarget';
import {optionGroups, optionLabel, formatValue} from '@/client/components/logpanel/aiAnalysis/aiDecisionOptions';
import {LogMessage} from '@/common/logs/LogMessage';
import {LogMessageType} from '@/common/logs/LogMessageType';
import {LogMessageDataType} from '@/common/logs/LogMessageDataType';
import {Color} from '@/common/Color';

function line(color: Color, id?: string): LogMessage {
  const message = new LogMessage(LogMessageType.DEFAULT, '${0} passed', [{type: LogMessageDataType.PLAYER, value: color}]);
  message.id = id;
  return message;
}

describe('aiLogTarget', () => {
  const aiColors = aiColorsOf([{color: 'red', name: 'Jens'}, {color: 'blue', name: 'Bot [AI+]'}]);

  it('knows AI players by their marker', () => {
    expect([...aiColors]).deep.eq(['blue']);
  });

  it('targets AI rows with a line id only', () => {
    const ai = line('blue', '1.a');
    expect(aiTargetOfRow({type: 'message', message: ai, indexes: [0]}, [ai], aiColors)?.messageId).eq('1.a');
    const human = line('red', '2.a');
    expect(aiTargetOfRow({type: 'message', message: human, indexes: [0]}, [human], aiColors)).is.undefined;
    const old = line('blue');
    expect(aiTargetOfRow({type: 'message', message: old, indexes: [0]}, [old], aiColors)).is.undefined;
  });

  it('collects the decision summaries', () => {
    const first = line('blue', '1.a');
    first.aiDecision = {id: 'd1', kind: 'action', title: 't', options: []};
    expect(decisionSummaries([first, line('blue', '2.a')]).get('d1')?.kind).eq('action');
  });

  it('groups the start selection and labels options', () => {
    const groups = optionGroups({id: 'd', kind: 'initial', title: '', options: [
      {label: 'Karte: Ants', card: 'Ants', group: 'project', value: 1},
      {label: 'Konzern: Helion', card: 'Helion', group: 'corporation', value: 5},
    ]});
    expect(groups.map((group) => group.title)).deep.eq(['Corporations', 'Project cards']);
    expect(optionLabel({label: 'Standard projects: City:SP'})).eq('Standard projects: City');
    expect(formatValue(2.04)).eq('+2.0');
  });
});
