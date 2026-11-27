import {expect} from 'chai';
import {composeFeedbackIssue, feedbackIssueUrl, SCREENSHOT_PLACEHOLDER} from '../../src/common/feedback/feedbackIssue';
import {FeedbackReport} from '../../src/common/feedback/FeedbackReport';

const REPORT: FeedbackReport = {
  name: 'Daniel',
  email: 'daniel@example.org',
  discord: '',
  general: 'Hand cards are squeezed',
  markers: [{kind: 'area', number: 2, text: 'Too small'}],
  screenshot: 'data:image/jpeg;base64,AAAA',
  diagnostics: [{label: 'URL', value: 'https://tm.example/spectator?id=s0123456789ab'}, {label: 'Note', value: 'player p0123456789ab | x'}],
};

describe('feedbackIssue', () => {
  it('writes text, markers and a place for the screenshot, no contact and no player ids', () => {
    const issue = composeFeedbackIssue(REPORT);
    expect(issue.title).eq('Feedback: Hand cards are squeezed');
    expect(issue.body).to.include('> Hand cards are squeezed');
    expect(issue.body).to.include('**Area 2**');
    expect(issue.body).to.include(SCREENSHOT_PLACEHOLDER);
    expect(issue.body).not.to.include('daniel@example.org');
    expect(issue.body).not.to.include('p0123456789ab');
    expect(issue.body).to.include('s0123456789ab');
    expect(issue.body).to.include('player p… \\| x');
  });

  it('opens the prefilled new-issue page of the game repository, short enough for an address', () => {
    const long = {...REPORT, diagnostics: Array.from({length: 40}, (_, index) => ({label: `Line ${index}`, value: 'x'.repeat(390)}))};
    const url = new URL(feedbackIssueUrl(long));
    expect(url.origin + url.pathname).eq('https://github.com/wrybit/terraforming-mars/issues/new');
    expect(url.searchParams.get('labels')).eq('feedback');
    expect(url.searchParams.get('body')!.length).to.be.at.most(6000);
    expect(url.searchParams.get('body')).to.include(SCREENSHOT_PLACEHOLDER);
  });
});
