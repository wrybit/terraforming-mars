import {expect} from 'chai';
import {aiSupportMatrix} from '@/client/components/admin/aiSupportMatrix';
import {AiSupport, EMPTY_AI_SUPPORT} from '@/common/ai/aiSupportContract';
import {BoardName} from '@/common/boards/BoardName';

describe('aiSupportMatrix', () => {
  const typescript: AiSupport = {...EMPTY_AI_SUPPORT, expansions: ['venus', 'prelude'], boards: [BoardName.THARSIS, BoardName.HELLAS]};
  const rust: AiSupport = {...EMPTY_AI_SUPPORT, botVersion: 'abc', expansions: ['colonies', 'venus'], boards: [BoardName.THARSIS]};

  it('joins both lists, rows of both programs first, and counts them', () => {
    const matrix = aiSupportMatrix(typescript, rust);
    expect(matrix.expansions.rows.map((row) => [row.chip.key, row.typescript, row.rust])).deep.eq([
      ['expansion:base', true, true],
      ['expansion:venus', true, true],
      ['expansion:prelude', true, false],
      ['expansion:colonies', false, true],
    ]);
    expect(matrix.expansions.both).eq(2);
    expect(matrix.boards.both).eq(1);
    expect(matrix.duneModules).is.undefined;
  });

  it('without a Rust bot the Rust AI plays nothing, not even the base game', () => {
    const matrix = aiSupportMatrix(typescript, undefined);
    expect(matrix.expansions.rows.every((row) => !row.rust)).is.true;
    expect(matrix.expansions.both).eq(0);
  });
});
