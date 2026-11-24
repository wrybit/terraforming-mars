// Frames around content, in two shapes: round for panels (header, summary, result), square for questions.
import {style} from './theme.mjs';
import {padVisible, terminalColumns, visibleLength} from './text.mjs';

const SHAPES = {
  round: {topLeft: '╭', topRight: '╮', bottomLeft: '╰', bottomRight: '╯'},
  square: {topLeft: '┌', topRight: '┐', bottomLeft: '└', bottomRight: '┘'},
};

/** Inner width of a box: as wide as wanted, but never wider than the terminal. */
export function boxWidth(wanted) {
  return Math.max(30, Math.min(wanted, terminalColumns() - 4));
}

/**
 * Lines of a framed box. `title` sits in the top border, `label` (e.g. "4 / 8") at its right end.
 * `sections`: arrays of lines, separated by a divider. `indent` shifts the whole box.
 */
export function box({title = '', label = '', sections, width, shape = 'round', indent = 0, titleStyle = style.white}) {
  const corners = SHAPES[shape];
  const border = style.orange;
  const inner = boxWidth(width);
  const prefix = ' '.repeat(indent);
  const titlePart = title ? `${border('─')} ${titleStyle(style.bold(title))} ` : '';
  const labelPart = label ? ` ${style.gray(label)} ${border('─')}` : '';
  const fill = Math.max(0, inner - visibleLength(titlePart) - visibleLength(labelPart));
  const lines = [`${prefix}${border(corners.topLeft)}${titlePart}${border('─'.repeat(fill))}${labelPart}${border(corners.topRight)}`];
  sections.forEach((section, index) => {
    if (index > 0) {
      lines.push(`${prefix}${border(`├${'─'.repeat(inner)}┤`)}`);
    }
    for (const line of section) {
      lines.push(`${prefix}${border('│')}${padVisible(line, inner)}${border('│')}`);
    }
  });
  lines.push(`${prefix}${border(`${corners.bottomLeft}${'─'.repeat(inner)}${corners.bottomRight}`)}`);
  return lines;
}
