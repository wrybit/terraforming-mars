import {FeedbackReport} from './FeedbackReport';

// Feedback without server delivery becomes a public issue of the game repository, written by the tester with their
// own GitHub account: the overlay opens the "new issue" page prefilled with this text. No token on any server.
// The screenshot cannot travel in the address; the overlay puts it into the clipboard to be pasted there.

export const FEEDBACK_ISSUE_REPOSITORY = 'wrybit/terraforming-mars';
const TITLE_EXCERPT_LENGTH = 70;
// Browsers and GitHub take long addresses, but not endless ones: the details are shortened first
const MAX_BODY_LENGTH = 6000;
// Where the tester pastes the screenshot: the issue text says so in plain words
export const SCREENSHOT_PLACEHOLDER = '(Paste the screenshot here: Ctrl+V or ⌘V)';

/** Player ids are the keys to a seat: never in public, spectator ids (watch only) may stay */
function withoutPlayerIds(text: string): string {
  return text.replace(/\bp[0-9a-f]{12}\b/g, 'p…');
}

function quote(text: string): string {
  return text.trim() === '' ? '–' : text.split('\n').map((line) => `> ${line}`).join('\n');
}

function excerpt(report: FeedbackReport): string {
  const first = [report.general, ...report.markers.map((marker) => marker.text)].find((text) => text.trim() !== '') ?? '';
  const line = first.trim().replace(/\s+/g, ' ');
  return line.length > TITLE_EXCERPT_LENGTH ? line.slice(0, TITLE_EXCERPT_LENGTH - 1) + '…' : line;
}

/** Title and Markdown of the issue */
export function composeFeedbackIssue(report: FeedbackReport): {title: string, body: string} {
  const markers = report.markers.flatMap((marker) => [`**${marker.kind === 'pin' ? 'Point' : 'Area'} ${marker.number}**`, '', quote(marker.text), '']);
  const details = report.diagnostics.map((line) => `| ${line.label} | ${withoutPlayerIds(line.value).replace(/\|/g, '\\|')} |`);
  const head = [
    '### Feedback',
    quote(report.general),
    '',
    ...(markers.length > 0 ? ['### Markers', '', ...markers] : []),
    '### Screenshot',
    SCREENSHOT_PLACEHOLDER,
    '',
  ].join('\n');
  let table = ['<details><summary>Technical details</summary>', '', '| | |', '|---|---|', ...details, '', '</details>'].join('\n');
  if (head.length + table.length > MAX_BODY_LENGTH) {
    table = '';
  }
  const text = excerpt(report);
  return {title: 'Feedback' + (text ? `: ${text}` : ''), body: (head + '\n' + table).slice(0, MAX_BODY_LENGTH)};
}

/** The prefilled "new issue" page of the game repository */
export function feedbackIssueUrl(report: FeedbackReport): string {
  const issue = composeFeedbackIssue(report);
  const query = new URLSearchParams({title: issue.title, body: issue.body, labels: 'feedback'});
  return `https://github.com/${FEEDBACK_ISSUE_REPOSITORY}/issues/new?${query.toString()}`;
}
