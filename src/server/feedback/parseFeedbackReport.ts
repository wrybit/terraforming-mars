import {RouteError} from '../routes/RouteError';
import {FEEDBACK_LIMITS, FeedbackDiagnostic, FeedbackMarker, FeedbackReport} from '../../common/feedback/FeedbackReport';

// Checks a report of the overlay (FeedbackOverlay.vue) before an extension delivers it: only the fields of the
// contract, each of the right type and size.

function text(value: unknown, maxLength: number): string {
  if (value === undefined) {
    return '';
  }
  if (typeof value !== 'string' || value.length > maxLength) {
    throw RouteError.badRequest('invalid feedback');
  }
  return value;
}

function list<T>(value: unknown, maxLength: number, item: (entry: Record<string, unknown>) => T): Array<T> {
  if (value === undefined) {
    return [];
  }
  if (!Array.isArray(value) || value.length > maxLength) {
    throw RouteError.badRequest('invalid feedback');
  }
  return value.map((entry) => {
    if (typeof entry !== 'object' || entry === null) {
      throw RouteError.badRequest('invalid feedback');
    }
    return item(entry as Record<string, unknown>);
  });
}

/** Accepts only the fields of the contract, each of the right type and size. */
export function parseFeedbackReport(body: string): FeedbackReport {
  let raw: unknown;
  try {
    raw = JSON.parse(body);
  } catch {
    throw RouteError.badRequest('invalid feedback');
  }
  if (typeof raw !== 'object' || raw === null) {
    throw RouteError.badRequest('invalid feedback');
  }
  const value = raw as Record<string, unknown>;
  const markers = list(value.markers, FEEDBACK_LIMITS.markers, (entry): FeedbackMarker => {
    if ((entry.kind !== 'pin' && entry.kind !== 'area') || !Number.isInteger(entry.number)) {
      throw RouteError.badRequest('invalid feedback');
    }
    return {kind: entry.kind, number: entry.number as number, text: text(entry.text, FEEDBACK_LIMITS.textLength)};
  });
  const diagnostics = list(value.diagnostics, FEEDBACK_LIMITS.diagnostics, (entry): FeedbackDiagnostic => ({
    label: text(entry.label, FEEDBACK_LIMITS.contactLength),
    value: text(entry.value, FEEDBACK_LIMITS.contactLength * 2),
  }));
  return {
    name: text(value.name, FEEDBACK_LIMITS.contactLength).trim(),
    email: text(value.email, FEEDBACK_LIMITS.contactLength).trim(),
    discord: text(value.discord, FEEDBACK_LIMITS.contactLength).trim(),
    general: text(value.general, FEEDBACK_LIMITS.textLength).trim(),
    markers,
    screenshot: text(value.screenshot, FEEDBACK_LIMITS.requestBytes),
    diagnostics,
  };
}
