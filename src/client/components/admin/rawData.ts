// json: pretty-printed; text: as delivered (e.g. Prometheus metrics); download: only a link
export type RawDataKind = 'json' | 'text' | 'download';

/** JSON indented for reading; anything else unchanged */
export function formatRawData(text: string, kind: RawDataKind): string {
  if (kind !== 'json') {
    return text;
  }
  try {
    return JSON.stringify(JSON.parse(text), undefined, 2);
  } catch {
    return text;
  }
}
